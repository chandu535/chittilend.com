import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ScrollPage } from '@/components/layout/PageLayout';
import { useState, useMemo } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { BorrowerCreateFlow } from '@/components/borrowers/BorrowerCreateFlow';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/Button';
import { AutoCalcPreview } from '@/components/loans/AutoCalcPreview';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { DateDisplay } from '@/components/shared/DateDisplay';
import { NameDisplay } from '@/components/shared/NameDisplay';
import { toast } from '@/components/ui/Toast';
import { searchBorrowers } from '@/server/functions/borrowers';
import { createLoan } from '@/server/functions/loans';
import { calculateLoan, calculateStartMonth, generatePaymentSchedule } from '@/lib/calculations';
import { can } from '@/lib/permissions';

export const Route = createFileRoute('/_authenticated/loans/new')({
  // Typing the URL is not a way around a hidden button.
  beforeLoad: ({ context }) => {
    if (!can(context.user, 'loans.create')) throw redirect({ to: '/loans' });
  },
  component: NewLoanPage,
});

type WizardStep = 'borrower' | 'amount' | 'schedule' | 'confirm';

function NewLoanPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState<WizardStep>('borrower');
  const [loading, setLoading] = useState(false);

  // Step 1: Borrower
  const [borrowerMode, setBorrowerMode] = useState<'search' | 'create'>('search');
  const [borrowerQuery, setBorrowerQuery] = useState('');
  const [borrowerResults, setBorrowerResults] = useState<Array<{ id: string; name: string; nameTelugu: string | null; mobile: string; area: string | null }>>([]);
  const [selectedBorrower, setSelectedBorrower] = useState<{ id: string; name: string; nameTelugu: string | null; mobile: string; area: string | null } | null>(null);


  // Step 2: Amount
  const [primaryAmount, setPrimaryAmount] = useState('');
  const [tenureMonths, setTenureMonths] = useState(5);
  const [frequency, setFrequency] = useState<'monthly' | 'weekly'>('monthly');
  const [dateGiven, setDateGiven] = useState(new Date().toISOString().split('T')[0]);

  // Calculations
  const calc = useMemo(() => {
    const amount = parseFloat(primaryAmount);
    if (!amount || amount < 1000) return null;
    return calculateLoan(amount, tenureMonths, frequency);
  }, [primaryAmount, tenureMonths, frequency]);

  const schedule = useMemo(() => {
    if (!calc || !dateGiven) return [];
    const startMonth = calculateStartMonth(new Date(dateGiven));
    return generatePaymentSchedule(startMonth, calc.totalRepayment, calc.totalInstallments, frequency);
  }, [calc, dateGiven, frequency]);

  const handleBorrowerSearch = async (query: string) => {
    setBorrowerQuery(query);
    if (query.length < 1) {
      setBorrowerResults([]);
      return;
    }
    try {
      const results = await searchBorrowers({ data: { query } });
      setBorrowerResults(results);
    } catch {
      setBorrowerResults([]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedBorrower || !calc) return;
    setLoading(true);
    try {
      const loan = await createLoan({
        data: {
          borrowerId: selectedBorrower.id,
          dateGiven,
          primaryAmount: parseFloat(primaryAmount),
          tenureMonths,
          paymentFrequency: frequency,
          serviceChargePercent: 1,
          markupPercent: 25,
        },
      });
      toast(t('loans.newLoan') + ' created', 'success');
      navigate({ to: '/loans/$loanId', params: { loanId: loan.id } });
    } catch (err) {
      toast(err instanceof Error ? err.message : t('errors.generic'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollPage>
      <div className="max-w-lg mx-auto space-y-4">
      <h2 className="text-2xl font-bold text-slate-900">{t('loans.createTitle')}</h2>

      {/* Step indicator */}
      <div className="flex gap-1">
        {(['borrower', 'amount', 'schedule', 'confirm'] as const).map((s, i) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full ${
              (['borrower', 'amount', 'schedule', 'confirm'] as const).indexOf(step) >= i
                ? 'bg-primary'
                : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* Step 1: Select Borrower */}
      {step === 'borrower' && (
        <Card>
          <CardTitle>{t('loans.selectBorrower')}</CardTitle>

          {/* Tab toggle */}
          <div className="mt-3 flex rounded-xl bg-slate-100 p-1 gap-1">
            <button
              type="button"
              onClick={() => {
                setBorrowerMode('search');
                setSelectedBorrower(null);
                setBorrowerQuery('');
              }}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                borrowerMode === 'search'
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t('loans.searchExisting')}
            </button>
            <button
              type="button"
              onClick={() => {
                setBorrowerMode('create');
                setSelectedBorrower(null);
              }}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                borrowerMode === 'create'
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              + {t('loans.newBorrower')}
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {borrowerMode === 'search' ? (
              selectedBorrower ? (
                <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-3">
                  <div>
                    <p className="font-medium text-slate-900"><NameDisplay name={selectedBorrower.name} nameTelugu={selectedBorrower.nameTelugu} /></p>
                    <p className="text-sm text-slate-500">{selectedBorrower.mobile}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedBorrower(null);
                      setBorrowerQuery('');
                    }}
                  >
                    {t('common.edit')}
                  </Button>
                </div>
              ) : (
                <>
                  <Input
                    placeholder={t('common.search')}
                    value={borrowerQuery}
                    onChange={(e) => handleBorrowerSearch(e.target.value)}
                  />
                  {borrowerResults.length > 0 && (
                    <ul className="rounded-lg border border-slate-200 divide-y divide-slate-100 max-h-48 overflow-y-auto">
                      {borrowerResults.map((b) => (
                        <li key={b.id}>
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2.5 hover:bg-slate-50 min-h-[44px]"
                            onClick={() => {
                              setSelectedBorrower(b);
                              setBorrowerResults([]);
                              setBorrowerQuery(b.name);
                            }}
                          >
                            <p className="text-sm font-medium"><NameDisplay name={b.name} nameTelugu={b.nameTelugu} /></p>
                            <p className="text-xs text-slate-400">{b.mobile}{b.area ? ` — ${b.area}` : ''}</p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )
            ) : (
              /* The whole add-borrower flow, not a cut-down copy of it. Someone added
                 while writing a loan gets the same photo, Aadhaar, location and surety as
                 one added from the Borrowers page — it is the same component. */
              <BorrowerCreateFlow
                saveLabel={t('common.next')}
                onCreated={(borrower) => {
                  // Switching back to 'search' matters: moving on unmounts the creation
                  // flow, so returning to this step would otherwise show an empty form
                  // and saving again would write a second borrower. Showing them as the
                  // selected borrower makes going back safe and says who was chosen.
                  setSelectedBorrower(borrower);
                  setBorrowerMode('search');
                  setBorrowerQuery(borrower.name);
                  setStep('amount');
                }}
              />
            )}

            {borrowerMode === 'search' && (
              <Button
                className="w-full"
                onClick={() => setStep('amount')}
                disabled={!selectedBorrower}
              >
                {t('common.next')}
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Step 2: Enter Amount */}
      {step === 'amount' && (
        <Card>
          <CardTitle>{t('loans.enterAmount')}</CardTitle>
          <p className="text-xs text-slate-400 mt-1 mb-3">{t('loans.autoCalcHint')}</p>
          <div className="space-y-4">
            <Input
              label={t('loans.primaryAmount')}
              value={primaryAmount}
              onChange={(e) => setPrimaryAmount(e.target.value.replace(/[^\d]/g, ''))}
              inputMode="numeric"
              lang="en"
              leftIcon={<span className="text-slate-500 text-sm">₹</span>}
            />

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('loans.tenure')}</label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setTenureMonths((t) => Math.max(1, t - 1))}
                    disabled={tenureMonths <= 1}
                  >
                    -
                  </Button>
                  <span className="text-lg font-semibold text-slate-900 min-w-[3ch] text-center">
                    {tenureMonths}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setTenureMonths((t) => Math.min(60, t + 1))}
                    disabled={tenureMonths >= 60}
                  >
                    +
                  </Button>
                  <span className="text-sm text-slate-500">{t('loans.months')}</span>
                </div>
              </div>
            </div>

            <Select
              label={t('loans.frequency')}
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as 'monthly' | 'weekly')}
              options={[
                { value: 'monthly', label: t('loans.monthly') },
                { value: 'weekly', label: t('loans.weekly') },
              ]}
            />

            <DatePicker
              label={t('loans.dateGiven')}
              value={dateGiven}
              onChange={(e) => setDateGiven(e.target.value)}
            />

            <AutoCalcPreview calc={calc} />

            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep('borrower')} className="flex-1">
                {t('common.back')}
              </Button>
              <Button
                onClick={() => setStep('schedule')}
                disabled={!calc}
                className="flex-1"
              >
                {t('common.next')}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 3: Review Schedule */}
      {step === 'schedule' && (
        <Card>
          <CardTitle>{t('loans.reviewSchedule')}</CardTitle>
          <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
            {schedule.map((s) => (
              <div key={s.installmentNumber} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
                <span className="text-slate-600">
                  #{s.installmentNumber}
                </span>
                <DateDisplay date={s.dueDate} className="text-slate-500" />
                <CurrencyDisplay
                  amount={s.amountDue}
                  className="font-medium text-slate-900"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="secondary" onClick={() => setStep('amount')} className="flex-1">
              {t('common.back')}
            </Button>
            <Button onClick={() => setStep('confirm')} className="flex-1">
              {t('common.next')}
            </Button>
          </div>
        </Card>
      )}

      {/* Step 4: Confirm */}
      {step === 'confirm' && calc && selectedBorrower && (
        <Card>
          <CardTitle>{t('loans.confirmCreate')}</CardTitle>
          <div className="mt-3 space-y-3">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-sm text-slate-500">{t('borrowers.name')}</p>
              <p className="font-medium"><NameDisplay name={selectedBorrower.name} nameTelugu={selectedBorrower.nameTelugu} /></p>
            </div>

            <AutoCalcPreview calc={calc} />

            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-sm text-slate-500">{t('loans.dateGiven')}</p>
              <DateDisplay date={dateGiven} className="font-medium" />
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep('schedule')} className="flex-1">
                {t('common.back')}
              </Button>
              <Button onClick={handleSubmit} loading={loading} className="flex-1">
                {t('loans.confirmCreate')}
              </Button>
            </div>
          </div>
        </Card>
      )}
      </div>
    </ScrollPage>
  );
}
