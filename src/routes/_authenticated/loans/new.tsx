import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ScrollPage } from '@/components/layout/PageLayout';
import { useState, useMemo } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { TeluguNamePreview } from '@/components/borrowers/TeluguNamePreview';
import { hasTeluguScript } from '@/lib/transliterate';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/Button';
import { AutoCalcPreview } from '@/components/loans/AutoCalcPreview';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { DateDisplay } from '@/components/shared/DateDisplay';
import { NameDisplay } from '@/components/shared/NameDisplay';
import { toast } from '@/components/ui/Toast';
import { searchBorrowers, createBorrower, updateBorrower } from '@/server/functions/borrowers';
import { createLoan } from '@/server/functions/loans';
import { calculateLoan, calculateStartMonth, generatePaymentSchedule } from '@/lib/calculations';
import { can } from '@/lib/permissions';

export const Route = createFileRoute('/_authenticated/loans/new')({
  // Typing the URL is not a way around a hidden button.
  beforeLoad: ({ context }) => {
    if (!can(context.user, 'loans.write')) throw redirect({ to: '/loans' });
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
  const [newBorrower, setNewBorrower] = useState({ name: '', nameTelugu: '', mobile: '', area: '', address: '' });
  const [newBorrowerErrors, setNewBorrowerErrors] = useState<Record<string, string>>({});
  const [creatingBorrower, setCreatingBorrower] = useState(false);
  // A borrower is created before the loan details are entered. Keep its id so that
  // returning to this step lets the user edit the same borrower instead of creating a duplicate.
  const [createdBorrowerId, setCreatedBorrowerId] = useState<string | null>(null);

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

  function validateNewBorrower(data: typeof newBorrower) {
    const errors: Record<string, string> = {};
    if (!data.name.trim() || data.name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
    if (!/^[6-9]\d{9}$/.test(data.mobile)) errors.mobile = 'Enter a valid 10-digit Indian mobile number';
    return errors;
  }

  const handleStep1Next = async () => {
    if (borrowerMode === 'search') {
      setStep('amount');
      return;
    }
    const errors = validateNewBorrower(newBorrower);
    if (Object.keys(errors).length > 0) {
      setNewBorrowerErrors(errors);
      return;
    }
    setCreatingBorrower(true);
    try {
      const borrowerData = {
        name: newBorrower.name.trim(),
        nameTelugu: hasTeluguScript(newBorrower.name.trim()) ? newBorrower.name.trim() : newBorrower.nameTelugu.trim() || undefined,
        mobile: newBorrower.mobile,
        area: newBorrower.area.trim() || undefined,
        address: newBorrower.address.trim() || undefined,
        suretyType: 'owner' as const,
      };
      const borrower = createdBorrowerId
        ? await updateBorrower({ data: { id: createdBorrowerId, ...borrowerData } })
        : await createBorrower({ data: borrowerData });

      setCreatedBorrowerId(borrower.id);
      setSelectedBorrower({ id: borrower.id, name: borrower.name, nameTelugu: borrower.nameTelugu, mobile: borrower.mobile, area: borrower.area });
      setStep('amount');
    } catch (err) {
      setNewBorrowerErrors({ mobile: err instanceof Error ? err.message : 'Failed to create borrower' });
    } finally {
      setCreatingBorrower(false);
    }
  };

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
                setCreatedBorrowerId(null);
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
                setNewBorrowerErrors({});
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
              <>
                <Input
                  label={t('borrowers.name')}
                  value={newBorrower.name}
                  onChange={(e) => {
                    setNewBorrower((p) => ({ ...p, name: e.target.value }));
                    setNewBorrowerErrors((p) => ({ ...p, name: '' }));
                  }}
                  error={newBorrowerErrors.name}
                  placeholder="Full name"
                />
                <TeluguNamePreview
                  name={newBorrower.name}
                  value={newBorrower.nameTelugu}
                  onChange={(nameTelugu) => setNewBorrower((p) => ({ ...p, nameTelugu }))}
                />
                <Input
                  label={t('borrowers.mobile')}
                  value={newBorrower.mobile}
                  onChange={(e) => {
                    setNewBorrower((p) => ({ ...p, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }));
                    setNewBorrowerErrors((p) => ({ ...p, mobile: '' }));
                  }}
                  error={newBorrowerErrors.mobile}
                  inputMode="numeric"
                  placeholder="10-digit mobile"
                />
                <Input
                  label={t('borrowers.area')}
                  value={newBorrower.area}
                  onChange={(e) => setNewBorrower((p) => ({ ...p, area: e.target.value }))}
                  placeholder={t('common.optional')}
                />
                <Input
                  label={t('borrowers.address')}
                  value={newBorrower.address}
                  onChange={(e) => setNewBorrower((p) => ({ ...p, address: e.target.value }))}
                  placeholder={t('common.optional')}
                />
                <p className="text-xs text-slate-400">{t('loans.photosLaterHint')}</p>
              </>
            )}

            <Button
              className="w-full"
              onClick={handleStep1Next}
              disabled={(borrowerMode === 'search' && !selectedBorrower) || creatingBorrower}
              loading={creatingBorrower}
            >
              {t('common.next')}
            </Button>
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
