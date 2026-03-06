import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { DateDisplay } from '@/components/shared/DateDisplay';
import { Badge } from '@/components/ui/Badge';
import { toast } from '@/components/ui/Toast';
import { markPaymentPaid, markPaymentPartial, markPaymentWaived, revertPayment } from '@/server/functions/payments';

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
  const isCompleted = payment.status === 'paid' || payment.status === 'waived';

  const [amountPaid, setAmountPaid] = useState(
    payment.status === 'partial' ? (amountDue - alreadyPaid).toFixed(0) : amountDue.toFixed(0),
  );
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [revertReason, setRevertReason] = useState('');
  const [loading, setLoading] = useState<'paid' | 'partial' | 'waived' | 'revert' | null>(null);

  const handleAction = async (action: 'paid' | 'partial' | 'waived') => {
    setLoading(action);
    try {
      if (action === 'waived') {
        if (!notes.trim()) {
          toast(t('payments.waiverReason'), 'error');
          setLoading(null);
          return;
        }
        await markPaymentWaived({ data: { paymentId: payment.id, notes } });
      } else {
        const amount = parseFloat(amountPaid);
        if (!amount || amount <= 0) {
          toast(t('common.required'), 'error');
          setLoading(null);
          return;
        }
        const fn = action === 'paid' ? markPaymentPaid : markPaymentPartial;
        await fn({
          data: {
            paymentId: payment.id,
            amountPaid: amount,
            paidDate,
            paymentMethod,
            notes: notes || undefined,
          },
        });
      }
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto shadow-xl">
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
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={onClose}
                  disabled={loading !== null}
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </>
          ) : (
            /* ---- Mark Payment View ---- */
            <>
              {/* Amount Input */}
              <Input
                label={t('payments.amountPaid')}
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value.replace(/[^\d.]/g, ''))}
                inputMode="decimal"
                lang="en"
                leftIcon={<span className="text-slate-500 text-sm">₹</span>}
              />

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
                  onClick={() => handleAction('paid')}
                  loading={loading === 'paid'}
                  disabled={loading !== null}
                >
                  {t('payments.markPaid')}
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => handleAction('partial')}
                  loading={loading === 'partial'}
                  disabled={loading !== null}
                >
                  {t('payments.markPartial')}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-purple-700 hover:bg-purple-50"
                  onClick={() => handleAction('waived')}
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
    </div>
  );
}
