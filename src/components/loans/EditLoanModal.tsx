import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DatePicker } from '@/components/ui/DatePicker';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { toast } from '@/components/ui/Toast';
import { updateLoanTerms } from '@/server/functions/loans';
import { calculateLoan } from '@/lib/calculations';
import { allocateReceipts } from '@/lib/schedule';
import { userFacingError } from '@/lib/userError';
import { useScrollLock } from '@/lib/useScrollLock';
import { useSheetTransition } from '@/lib/useSheetTransition';
import { DEFAULTS, LIMITS } from '@/lib/constants';

type Frequency = 'monthly' | 'weekly';

interface EditLoanModalProps {
  loan: {
    id: string;
    primaryAmount: string;
    serviceChargePercent: string;
    markupPercent: string;
    paymentFrequency: string;
    totalInstallments: number;
    dateGiven: string;
    notes: string | null;
    payments: Array<{ amountPaid: string; paidDate: string | null }>;
  };
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Editing what a loan actually is.
 *
 * The amount, the frequency, the count and the start date are one decision, not four: each
 * rewrites the schedule, and the schedule is what the borrower owes month by month. So they
 * are edited together and previewed together, with the consequence stated before it is
 * committed rather than discovered afterwards.
 *
 * The preview is not an approximation. It runs the same calculateLoan and allocateReceipts
 * the server will, so the instalment shown here is the instalment written — the mistake the
 * old extend-tenure dialog made by re-deriving its own figure.
 */
export function EditLoanModal({ loan, onClose, onSaved }: EditLoanModalProps) {
  const { closing, requestClose } = useSheetTransition(onClose);
  const { t } = useTranslation();

  const [amount, setAmount] = useState(String(Math.round(parseFloat(loan.primaryAmount))));
  const [frequency, setFrequency] = useState<Frequency>(loan.paymentFrequency as Frequency);
  const [count, setCount] = useState(loan.totalInstallments);
  const [dateGiven, setDateGiven] = useState(loan.dateGiven);
  const [saving, setSaving] = useState(false);

  useScrollLock(true);

  /**
   * Switching frequency resets the count to that frequency's own norm.
   *
   * Twelve weekly and five monthly are different products rather than the same length
   * expressed two ways, so converting the number on screen — five months becoming twenty
   * weeks — would produce an arrangement nobody offers. Picking a frequency is choosing the
   * shape of the loan, and the count that goes with it is the starting point, still
   * adjustable afterwards.
   */
  const changeFrequency = (next: Frequency) => {
    if (next === frequency) return;
    setFrequency(next);
    setCount(DEFAULTS.INSTALMENTS[next]);
  };

  const principal = Number(amount) || 0;

  // The server keeps this loan's own service charge and markup, so the preview must too.
  const calc = useMemo(
    () => calculateLoan(
      principal,
      count,
      'monthly', // count is already the instalment count; the frequency only shapes the dates
      parseFloat(loan.serviceChargePercent),
      parseFloat(loan.markupPercent),
    ),
    [principal, count, loan.serviceChargePercent, loan.markupPercent],
  );

  const collected = loan.payments.reduce((sum, p) => sum + parseFloat(p.amountPaid), 0);

  // Where the money already collected lands on the schedule as edited.
  const landing = useMemo(() => {
    if (principal <= 0 || count < 1) return null;
    const each = calc.totalRepayment / count;
    const rows = allocateReceipts(
      Array.from({ length: count }, (_, i) => ({ installmentNumber: i + 1, amountDue: each })),
      loan.payments
        .filter((p) => parseFloat(p.amountPaid) > 0)
        .map((p) => ({ amount: parseFloat(p.amountPaid), date: p.paidDate })),
    );
    return {
      paid: rows.filter((r) => r.status === 'paid').length,
      partial: rows.filter((r) => r.status === 'partial').length,
      settled: collected >= calc.totalRepayment - 0.01,
      owing: Math.max(0, calc.totalRepayment - collected),
    };
  }, [principal, count, calc.totalRepayment, loan.payments, collected]);

  const tooSmall = principal > 0 && principal < LIMITS.MIN_LOAN_AMOUNT;
  const valid = principal >= LIMITS.MIN_LOAN_AMOUNT && count >= 1 && count <= 120 && Boolean(dateGiven);

  const changed = principal !== Math.round(parseFloat(loan.primaryAmount))
    || frequency !== loan.paymentFrequency
    || count !== loan.totalInstallments
    || dateGiven !== loan.dateGiven;

  const handleSubmit = async () => {
    if (!valid || !changed) return;
    setSaving(true);
    try {
      await updateLoanTerms({
        data: {
          id: loan.id,
          primaryAmount: principal,
          paymentFrequency: frequency,
          totalInstallments: count,
          dateGiven,
          notes: loan.notes,
        },
      });
      toast(t('loans.termsUpdated'), 'success');
      onSaved();
    } catch (err) {
      toast(userFacingError(err, t('errors.generic')), 'error');
    } finally {
      setSaving(false);
    }
  };

  // Portalled so the overlay can never be trapped by a `contain: paint` ancestor —
  // `content-visibility` on list rows creates exactly that containing block.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="sheet-backdrop absolute inset-0 bg-black/40" data-closing={closing} onClick={requestClose} />
      <div
        className="sheet-panel sheet-panel--responsive relative max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-card shadow-xl sm:max-w-md sm:rounded-2xl"
        data-closing={closing}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-slate-100 bg-card px-4 py-3">
          <h3 className="text-lg font-semibold text-slate-900">{t('loans.editLoan')}</h3>
          <button
            type="button"
            onClick={requestClose}
            aria-label={t('common.cancel')}
            className="flex min-h-11 min-w-11 items-center justify-center text-slate-400 hover:text-slate-600"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 p-4">
          <Input
            label={t('loans.amountGiven')}
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, '').slice(0, 9))}
            inputMode="numeric"
            lang="en"
            leftIcon={<span className="text-sm text-slate-500">₹</span>}
            error={tooSmall ? t('loans.minimumAmount', { amount: LIMITS.MIN_LOAN_AMOUNT.toLocaleString('en-IN') }) : undefined}
          />

          {/* Frequency first, because it decides what the count below it means — and
              choosing it resets that count to this frequency's own default. */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('loans.frequency')}</label>
            <div className="grid grid-cols-2 gap-2">
              {(['monthly', 'weekly'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => changeFrequency(option)}
                  aria-pressed={frequency === option}
                  className={clsx(
                    'min-h-11 rounded-xl border text-sm font-semibold transition-colors',
                    frequency === option
                      ? 'border-brand bg-primary/10 text-brand'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {t(`loans.${option}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {t(frequency === 'weekly' ? 'loans.weeks' : 'loans.months')}
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCount((n) => Math.max(1, n - 1))}
                disabled={count <= 1}
                aria-label={t('loans.fewerInstallments')}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-xl font-semibold text-brand transition-colors hover:bg-slate-50 disabled:opacity-30"
              >
                −
              </button>
              <span className="min-w-[3ch] text-center text-2xl font-bold tabular text-slate-900">{count}</span>
              <button
                type="button"
                onClick={() => setCount((n) => Math.min(120, n + 1))}
                disabled={count >= 120}
                aria-label={t('loans.moreInstallments')}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-xl font-semibold text-brand transition-colors hover:bg-slate-50 disabled:opacity-30"
              >
                +
              </button>
            </div>
          </div>

          <DatePicker
            label={t('loans.dateGiven')}
            value={dateGiven}
            onChange={(e) => setDateGiven(e.target.value)}
          />

          {principal > 0 && (
            <div className="space-y-2 rounded-xl border border-brand/20 bg-primary/5 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">{t('loans.totalRepayment')}</span>
                <CurrencyDisplay amount={calc.totalRepayment} className="font-bold text-slate-900" />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('loans.installmentAmount')}</span>
                <span className="font-semibold text-slate-900">
                  <CurrencyDisplay amount={calc.totalRepayment / count} /> × {count}
                </span>
              </div>

              {/* What happens to money already collected. Stated rather than discovered:
                  an edit can reopen a settled loan or close an open one. */}
              {collected > 0 && landing && (
                <div className="space-y-1 border-t border-brand/20 pt-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('loans.totalPaid')}</span>
                    <CurrencyDisplay amount={collected} className="font-semibold text-emerald-600" />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('loans.outstanding')}</span>
                    <CurrencyDisplay amount={landing.owing} className="font-semibold text-slate-900" />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {t('loans.moneyKept', { paid: landing.paid, count })}
                  </p>
                  {landing.settled && (
                    <p className="text-[11px] font-medium text-emerald-600">{t('loans.willSettle')}</p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2 pt-1">
            <Button className="w-full" onClick={handleSubmit} loading={saving} disabled={!valid || !changed || saving}>
              {t('common.save')}
            </Button>
            <Button variant="ghost" className="w-full" onClick={requestClose} disabled={saving}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
