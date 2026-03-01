import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { DateDisplay } from '@/components/shared/DateDisplay';
import { Badge } from '@/components/ui/Badge';

interface Payment {
  id: string;
  installmentNumber: number;
  dueDate: string;
  amountDue: string;
  amountPaid: string;
  paidDate: string | null;
  status: 'pending' | 'paid' | 'partial' | 'overdue' | 'waived';
}

const statusIcons: Record<string, string> = {
  paid: '\u2713',
  pending: '\u25CB',
  overdue: '\u25CF',
  partial: '\u25D1',
  waived: '\u2014',
};

export function PortalPaymentList({ payments }: { payments: Payment[] }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-0">
      {payments.map((payment, index) => {
        const isLast = index === payments.length - 1;

        return (
          <div key={payment.id} className="flex gap-3">
            {/* Timeline dot + line */}
            <div className="flex flex-col items-center">
              <div
                className={clsx(
                  'h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                  payment.status === 'paid' && 'bg-emerald-100 text-emerald-700',
                  payment.status === 'overdue' && 'bg-red-100 text-red-700',
                  payment.status === 'partial' && 'bg-amber-100 text-amber-700',
                  payment.status === 'waived' && 'bg-purple-100 text-purple-700',
                  payment.status === 'pending' && 'bg-slate-100 text-slate-400',
                )}
              >
                {statusIcons[payment.status]}
              </div>
              {!isLast && (
                <div
                  className={clsx(
                    'w-0.5 flex-1 min-h-[12px]',
                    payment.status === 'paid' ? 'bg-emerald-200' : 'bg-slate-200',
                  )}
                />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 rounded-lg border border-slate-100 p-2.5 mb-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">
                  {t('payments.installmentNo', { number: payment.installmentNumber })}
                </span>
                <Badge status={payment.status}>
                  {t(`payments.${payment.status}`)}
                </Badge>
              </div>
              <div className="flex items-center justify-between mt-1">
                <DateDisplay date={payment.dueDate} className="text-xs text-slate-400" />
                <CurrencyDisplay
                  amount={parseFloat(payment.amountDue)}
                  className="text-sm font-semibold text-slate-900"
                />
              </div>
              {payment.status === 'paid' && payment.paidDate && (
                <p className="mt-0.5 text-xs text-emerald-600">
                  {t('payments.paidDate')}: <DateDisplay date={payment.paidDate} />
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
