import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { toast } from '@/components/ui/Toast';
import { extendTenure } from '@/server/functions/loans';

interface ExtendTenureModalProps {
  loan: {
    id: string;
    tenureMonths: number;
    totalInstallments: number;
    paidInstallments: number;
    installmentAmount: string;
    totalRepayment: string;
    paymentFrequency: string;
    payments: Array<{ status: string; amountPaid: string }>;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export function ExtendTenureModal({ loan, onClose, onSuccess }: ExtendTenureModalProps) {
  const { t } = useTranslation();
  const [newTenure, setNewTenure] = useState('');
  const [loading, setLoading] = useState(false);

  const paidAmount = loan.payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + parseFloat(p.amountPaid), 0);

  const remainingAmount = parseFloat(loan.totalRepayment) - paidAmount;
  const newTenureNum = parseInt(newTenure) || 0;
  const newTotalInstallments = loan.paymentFrequency === 'monthly' ? newTenureNum : newTenureNum * 4;
  const paidInstallments = loan.payments.filter((p) => p.status === 'paid').length;
  const newRemainingInstallments = newTotalInstallments - paidInstallments;
  const newInstallmentAmount = newRemainingInstallments > 0 ? remainingAmount / newRemainingInstallments : 0;
  const isValid = newTenureNum > loan.tenureMonths && newRemainingInstallments > 0;

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      await extendTenure({ data: { id: loan.id, newTenureMonths: newTenureNum } });
      toast('Tenure extended successfully', 'success');
      onSuccess();
    } catch (err) {
      toast(err instanceof Error ? err.message : t('errors.generic'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-xl">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between rounded-t-2xl">
          <h3 className="text-lg font-semibold text-slate-900">{t('loans.extendTenure')}</h3>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 min-w-11 flex items-center justify-center text-slate-400 hover:text-slate-600"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Current info */}
          <div className="rounded-lg bg-slate-50 p-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Current tenure</span>
              <span className="font-medium text-slate-900">{loan.tenureMonths} months</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Installments paid</span>
              <span className="font-medium text-slate-900">{paidInstallments} / {loan.totalInstallments}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Remaining balance</span>
              <CurrencyDisplay amount={remainingAmount} className="font-semibold text-slate-900" />
            </div>
          </div>

          <Input
            label={t('loans.newTenure')}
            value={newTenure}
            onChange={(e) => setNewTenure(e.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
            placeholder={`More than ${loan.tenureMonths} months`}
          />

          {/* Preview */}
          {newTenureNum > loan.tenureMonths && newRemainingInstallments > 0 && (
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 space-y-1.5 text-sm">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">New schedule preview</p>
              <div className="flex justify-between">
                <span className="text-slate-500">New installment amount</span>
                <CurrencyDisplay amount={newInstallmentAmount} className="font-bold text-slate-900" />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Remaining installments</span>
                <span className="font-medium text-slate-900">{newRemainingInstallments}</span>
              </div>
            </div>
          )}

          {newTenureNum > 0 && newTenureNum <= loan.tenureMonths && (
            <p className="text-sm text-red-500">New tenure must be longer than current ({loan.tenureMonths} months)</p>
          )}

          <div className="space-y-2 pt-1">
            <Button className="w-full" onClick={handleSubmit} loading={loading} disabled={!isValid || loading}>
              Extend to {newTenureNum > 0 ? `${newTenureNum} months` : '...'}
            </Button>
            <Button variant="ghost" className="w-full" onClick={onClose} disabled={loading}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
