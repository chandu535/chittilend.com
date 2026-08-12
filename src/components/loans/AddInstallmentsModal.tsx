import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { toast } from '@/components/ui/Toast';
import { addInstallments } from '@/server/functions/loans';
import { respreadSchedule, type ScheduleStatus } from '@/lib/schedule';
import { useScrollLock } from '@/lib/useScrollLock';
import { useSheetTransition } from '@/lib/useSheetTransition';

interface AddInstallmentsModalProps {
  loan: {
    id: string;
    totalInstallments: number;
    totalRepayment: string;
    paymentFrequency: string;
    payments: Array<{ id: string; installmentNumber: number; amountDue: string; amountPaid: string; status: string }>;
  };
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Adds instalments to a loan whose schedule ran out before the money did.
 *
 * The preview is computed with the same `respreadSchedule` the server uses, rather than a
 * second copy of the arithmetic in the component. That is deliberate: the old extend-tenure
 * dialog re-derived the new instalment amount in its own way, and the two drifted — it
 * counted only fully paid rows, so a loan with a part-paid instalment previewed a figure the
 * server would not produce. Here the number on the button is the number that gets written.
 */
export function AddInstallmentsModal({ loan, onClose, onSuccess }: AddInstallmentsModalProps) {
  const { closing, requestClose } = useSheetTransition(onClose);
  const { t } = useTranslation();
  const [target, setTarget] = useState(loan.totalInstallments + 1);
  const [loading, setLoading] = useState(false);

  useScrollLock(true);

  const weekly = loan.paymentFrequency === 'weekly';

  const preview = useMemo(() => {
    try {
      return {
        plan: respreadSchedule(
          loan.payments.map((p) => ({
            id: p.id,
            installmentNumber: p.installmentNumber,
            amountDue: parseFloat(p.amountDue),
            amountPaid: parseFloat(p.amountPaid),
            status: p.status as ScheduleStatus,
          })),
          target,
          parseFloat(loan.totalRepayment),
        ),
        error: null as string | null,
      };
    } catch (err) {
      return { plan: null, error: err instanceof Error ? err.message : t('errors.generic') };
    }
  }, [loan.payments, loan.totalRepayment, target, t]);

  const added = target - loan.totalInstallments;
  const changedCount = preview.plan?.rows.filter((r) => !r.isNew && r.changed).length ?? 0;

  const handleSubmit = async () => {
    if (!preview.plan) return;
    setLoading(true);
    try {
      await addInstallments({ data: { id: loan.id, totalInstallments: target } });
      toast(t('loans.installmentsAdded', { count: added }), 'success');
      onSuccess();
    } catch (err) {
      toast(err instanceof Error ? err.message : t('errors.generic'), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Portalled so the overlay can never be trapped by a `contain: paint` ancestor —
  // `content-visibility` on list rows creates exactly that containing block.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="sheet-backdrop absolute inset-0 bg-black/40" data-closing={closing} onClick={requestClose} />
      <div
        className="sheet-panel sheet-panel--responsive relative bg-card rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-xl"
        data-closing={closing}
      >
        <div className="sticky top-0 bg-card border-b border-slate-100 px-4 py-3 flex items-center justify-between rounded-t-2xl">
          <h3 className="text-lg font-semibold text-slate-900">{t('loans.addInstallments')}</h3>
          <button
            type="button"
            onClick={requestClose}
            aria-label={t('common.cancel')}
            className="min-h-11 min-w-11 flex items-center justify-center text-slate-400 hover:text-slate-600"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-sm text-slate-500">{t('loans.addInstallmentsHint')}</p>

          {/* A stepper, not a text field. The change is almost always one or two more, and
              typing a number invites the typo this is least able to absorb. */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 p-2">
            <button
              type="button"
              onClick={() => setTarget((n) => Math.max(loan.totalInstallments + 1, n - 1))}
              disabled={target <= loan.totalInstallments + 1}
              aria-label={t('loans.fewerInstallments')}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-xl font-semibold text-brand transition-colors hover:bg-slate-50 disabled:opacity-30"
            >
              −
            </button>

            <div className="text-center">
              <p className="text-2xl font-bold tabular text-slate-900">
                {loan.totalInstallments} → {target}
              </p>
              <p className="text-xs text-slate-400">
                {t(weekly ? 'loans.addingWeekly' : 'loans.addingMonthly', { count: added })}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setTarget((n) => Math.min(120, n + 1))}
              disabled={target >= 120}
              aria-label={t('loans.moreInstallments')}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-xl font-semibold text-brand transition-colors hover:bg-slate-50 disabled:opacity-30"
            >
              +
            </button>
          </div>

          {preview.plan && (
            <div className="rounded-lg bg-primary/5 border border-brand/20 p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">{t('loans.newInstallmentAmount')}</span>
                <CurrencyDisplay amount={preview.plan.installmentAmount} className="font-bold text-slate-900" />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('loans.stillToCollect')}</span>
                <CurrencyDisplay amount={preview.plan.outstanding} className="font-semibold text-slate-900" />
              </div>

              {/* The reassurance that matters most, stated rather than implied: the borrower
                  is not being charged for taking longer. */}
              <div className="flex justify-between border-t border-brand/20 pt-2">
                <span className="text-slate-500">{t('loans.totalRepayment')}</span>
                <div className="text-right">
                  <CurrencyDisplay amount={parseFloat(loan.totalRepayment)} className="font-semibold text-slate-900" />
                  <p className="text-[11px] text-emerald-600">{t('loans.totalUnchanged')}</p>
                </div>
              </div>

              {changedCount > 0 && (
                <p className="text-[11px] text-slate-400">
                  {t('loans.rescheduledCount', { count: changedCount })}
                </p>
              )}
            </div>
          )}

          {preview.error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{preview.error}</p>
          )}

          <div className="space-y-2 pt-1">
            <Button
              className="w-full"
              onClick={handleSubmit}
              loading={loading}
              disabled={!preview.plan || loading}
            >
              {t('loans.addInstallmentsAction', { count: added })}
            </Button>
            <Button variant="ghost" className="w-full" onClick={requestClose} disabled={loading}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
