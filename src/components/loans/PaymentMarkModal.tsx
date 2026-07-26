import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { DateDisplay } from '@/components/shared/DateDisplay';
import { Badge } from '@/components/ui/Badge';
import { toast } from '@/components/ui/Toast';
import { markPaymentPaid, markPaymentWaived, revertPayment } from '@/server/functions/payments';
import { useScrollLock } from '@/lib/useScrollLock';

interface Payment {
  id: string;
  installmentNumber: number;
  dueDate: string;
  amountDue: string;
  amountPaid: string;
  status: 'pending' | 'paid' | 'partial' | 'overdue' | 'waived';
}

interface PaymentMarkModalProps {
  payment: Payment;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentMarkModal({ payment, onClose, onSuccess }: PaymentMarkModalProps) {
  const { t } = useTranslation();
  const amountDue = parseFloat(payment.amountDue);
  const alreadyPaid = parseFloat(payment.amountPaid);
  const remainingToPay = amountDue - alreadyPaid;
  const isCompleted = payment.status === 'paid' || payment.status === 'waived';

  // Amount the user is paying now (not cumulative total)
  const [amountNow, setAmountNow] = useState(remainingToPay.toFixed(2));
  const [partialMode, setPartialMode] = useState(false);
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [revertReason, setRevertReason] = useState('');
  const [loading, setLoading] = useState<'submit' | 'waived' | 'revert' | null>(null);

  useScrollLock(true);

  // Total including previous partial payments
  const totalAfterPayment = alreadyPaid + parseFloat(amountNow || '0');
  const willBeFullyPaid = totalAfterPayment >= amountDue;

  const handleSubmit = async () => {
    const amount = parseFloat(amountNow);
    if (!amount || amount <= 0) {
      toast(t('common.required'), 'error');
      return;
    }
    setLoading('submit');
    try {
      await markPaymentPaid({
        data: {
          paymentId: payment.id,
          amountPaid: totalAfterPayment,
          paidDate,
          paymentMethod,
          notes: notes || undefined,
        },
      });
      toast(t('payments.confirmPayment'), 'success');
      onSuccess();
    } catch (err) {
      toast(err instanceof Error ? err.message : t('errors.generic'), 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleWaive = async () => {
    if (!notes.trim()) {
      toast(t('payments.waiverReason'), 'error');
      return;
    }
    setLoading('waived');
    try {
      await markPaymentWaived({ data: { paymentId: payment.id, notes } });
      toast(t('payments.confirmPayment'), 'success');
      onSuccess();
    } catch (err) {
      toast(err instanceof Error ? err.message : t('errors.generic'), 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleRevert = async () => {
    setLoading('revert');
    try {
      await revertPayment({
        data: {
          paymentId: payment.id,
          reason: revertReason || undefined,
        },
      });
      toast(t('payments.revertSuccess'), 'success');
      onSuccess();
    } catch (err) {
      const message = err instanceof Error && err.message.includes('PAYMENT_ALREADY_PENDING')
        ? t('payments.alreadyPending')
        : err instanceof Error ? err.message : t('errors.generic');
      toast(message, 'error');
    } finally {
      setLoading(null);
    }
  };

  const togglePartialMode = () => {
    if (partialMode) {
      // Reset to full remaining amount
      setAmountNow(remainingToPay.toFixed(2));
    }
    setPartialMode((m) => !m);
  };

  // Portalled to <body> deliberately. This modal renders inside LoanCard, and the card
  // sits in a `.list-row` whose `content-visibility: auto` implies `contain: paint` —
  // which makes the card a containing block for `position: fixed`. Left inline, the
  // modal anchors to the card instead of the viewport and is clipped off screen.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Sheet. dvh so mobile browser chrome is accounted for; the bottom padding keeps
          the last action clear of the home indicator. */}
      <div className="relative flex max-h-[88dvh] w-full flex-col overflow-y-auto overscroll-contain rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)] shadow-xl sm:max-w-md sm:rounded-2xl sm:pb-0">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between rounded-t-2xl">
          <h3 className="text-lg font-semibold text-slate-900">
            {t('payments.installmentNo', { number: payment.installmentNumber })}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Payment Info */}
          <div className="rounded-lg bg-slate-50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{t('payments.dueDate')}</span>
              <DateDisplay date={payment.dueDate} className="text-sm font-medium text-slate-900" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{t('payments.amountDue')}</span>
              <CurrencyDisplay amount={amountDue} className="text-lg font-bold text-slate-900" />
            </div>
            {alreadyPaid > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">{t('payments.amountPaid')}</span>
                <CurrencyDisplay amount={alreadyPaid} className="text-sm font-medium text-amber-600" />
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{t('common.status')}</span>
              <Badge status={payment.status}>{t(`payments.${payment.status}`)}</Badge>
            </div>
          </div>

          {isCompleted ? (
            /* ---- Revert View ---- */
            <>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm text-amber-800">{t('payments.revertConfirm')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('payments.revertReason')}
                </label>
                <textarea
                  value={revertReason}
                  onChange={(e) => setRevertReason(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  placeholder={t('payments.revertReason')}
                />
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  variant="danger"
                  className="w-full"
                  onClick={handleRevert}
                  loading={loading === 'revert'}
                  disabled={loading !== null}
                >
                  {t('payments.revertPayment')}
                </Button>
                <Button variant="ghost" className="w-full" onClick={onClose} disabled={loading !== null}>
                  {t('common.cancel')}
                </Button>
              </div>
            </>
          ) : (
            /* ---- Mark Payment View ---- */
            <>
              {/* Amount field — disabled by default, enabled in partial mode */}
              <div>
                <Input
                  label={t('payments.amountPaid')}
                  value={amountNow}
                  onChange={(e) => setAmountNow(e.target.value.replace(/[^0-9.]/g, ''))}
                  inputMode="decimal"
                  lang="en"
                  leftIcon={<span className="text-slate-500 text-sm">₹</span>}
                  disabled={!partialMode}
                />
                {/* Partial toggle */}
                <button
                  type="button"
                  onClick={togglePartialMode}
                  className="mt-1.5 text-xs text-primary font-medium hover:underline"
                >
                  {partialMode ? t('payments.payFullAmount') : t('payments.payDifferentAmount')}
                </button>
              </div>

              {/* Remaining preview when partial mode and not full payment */}
              {partialMode && !willBeFullyPaid && totalAfterPayment > 0 && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 flex items-center justify-between">
                  <span className="text-sm text-amber-700">{t('payments.remainingAmount')}</span>
                  <CurrencyDisplay
                    amount={amountDue - totalAfterPayment}
                    className="text-sm font-bold text-amber-700"
                  />
                </div>
              )}

              {/* Date */}
              <DatePicker
                label={t('payments.paidDate')}
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
              />

              {/* Payment Method */}
              <Select
                label={t('payments.paymentMethod')}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                options={[
                  { value: 'cash', label: t('payments.cash') },
                  { value: 'upi', label: t('payments.upi') },
                  { value: 'bank_transfer', label: t('payments.bankTransfer') },
                  { value: 'other', label: t('payments.other') },
                ]}
              />

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.notes')}</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  placeholder={t('common.notes')}
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  loading={loading === 'submit'}
                  disabled={loading !== null}
                >
                  {willBeFullyPaid ? t('payments.markPaid') : t('payments.markPartial')}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-purple-700 hover:bg-purple-50"
                  onClick={handleWaive}
                  loading={loading === 'waived'}
                  disabled={loading !== null}
                >
                  {t('payments.markWaived')}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}