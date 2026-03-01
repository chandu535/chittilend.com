import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/Badge';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { DateDisplay } from '@/components/shared/DateDisplay';

interface LoanCardProps {
  id: string;
  borrowerName: string;
  primaryAmount: string;
  status: 'active' | 'completed' | 'defaulted' | 'extended';
  totalInstallments: number;
  paidInstallments: number;
  dateGiven: string;
}

export function LoanCard({
  id,
  borrowerName,
  primaryAmount,
  status,
  totalInstallments,
  paidInstallments,
  dateGiven,
}: LoanCardProps) {
  const { t } = useTranslation();
  const progress = totalInstallments > 0 ? (paidInstallments / totalInstallments) * 100 : 0;

  return (
    <Link
      to="/loans/$loanId"
      params={{ loanId: id }}
      className="block rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0">
          <p className="font-medium text-slate-900 truncate">{borrowerName}</p>
          <CurrencyDisplay
            amount={parseFloat(primaryAmount)}
            className="text-lg font-bold text-slate-900"
          />
        </div>
        <Badge status={status}>
          {t(`loans.status${status.charAt(0).toUpperCase() + status.slice(1)}`)}
        </Badge>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span>{t('loans.progress', { paid: paidInstallments, total: totalInstallments })}</span>
          <DateDisplay date={dateGiven} className="text-slate-400" />
        </div>
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
