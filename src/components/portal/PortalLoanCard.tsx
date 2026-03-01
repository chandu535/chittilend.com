import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/Badge';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { DateDisplay } from '@/components/shared/DateDisplay';
import type { STATUS_COLORS } from '@/lib/constants';

type StatusKey = keyof typeof STATUS_COLORS;

interface PortalLoanCardProps {
  primaryAmount: string;
  totalRepayment: string;
  installmentAmount: string;
  totalInstallments: number;
  paidCount: number;
  totalRemaining: number;
  paymentFrequency: string;
  status: StatusKey;
  nextDue: { dueDate: string; amountDue: string } | null;
}

export function PortalLoanCard({
  primaryAmount,
  totalRepayment,
  installmentAmount,
  totalInstallments,
  paidCount,
  totalRemaining,
  paymentFrequency,
  status,
  nextDue,
}: PortalLoanCardProps) {
  const { t } = useTranslation();
  const progress = totalInstallments > 0 ? (paidCount / totalInstallments) * 100 : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
      {/* Amount summary */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">{t('loans.primaryAmount')}</p>
          <CurrencyDisplay amount={parseFloat(primaryAmount)} className="text-lg font-bold text-slate-900" />
        </div>
        <Badge status={status}>
          {t(`loans.status${status.charAt(0).toUpperCase() + status.slice(1)}`)}
        </Badge>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-slate-500">{t('loans.totalRepayment')}</p>
          <CurrencyDisplay amount={parseFloat(totalRepayment)} className="font-semibold text-slate-900" />
        </div>
        <div>
          <p className="text-slate-500">{t('loans.installment')}</p>
          <CurrencyDisplay amount={parseFloat(installmentAmount)} className="font-semibold text-slate-900" />
          <span className="text-xs text-slate-400 ml-1">
            {paymentFrequency === 'monthly' ? t('loans.perMonth') : t('loans.perWeek')}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div>
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span>{t('loans.progress', { paid: paidCount, total: totalInstallments })}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Remaining & Next Due */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-slate-50 p-2">
          <p className="text-xs text-slate-500">{t('portal.totalRemaining')}</p>
          <CurrencyDisplay amount={totalRemaining} className="font-bold text-slate-900" />
        </div>
        <div className="rounded-lg bg-slate-50 p-2">
          <p className="text-xs text-slate-500">{t('portal.nextDue')}</p>
          {nextDue ? (
            <>
              <CurrencyDisplay amount={parseFloat(nextDue.amountDue)} className="font-bold text-slate-900" />
              <DateDisplay date={nextDue.dueDate} className="text-xs text-slate-400 block" />
            </>
          ) : (
            <p className="text-xs font-medium text-emerald-600">{t('portal.noDue')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
