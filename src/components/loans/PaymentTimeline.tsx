import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
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

interface PaymentTimelineProps {
  payments: Payment[];
  onPaymentTap?: (payment: Payment) => void;
}

const statusIcons: Record<string, string> = {
  paid: '\u2713',
  pending: '\u25CB',
  overdue: '\u25CF',
  partial: '\u25D1',
  waived: '\u2014',
};

export function PaymentTimeline({ payments, onPaymentTap }: PaymentTimelineProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-0">
      {payments.map((payment, index) => {
        const isLast = index === payments.length - 1;
        const isActionable = payment.status === 'pending' || payment.status === 'overdue' || payment.status === 'partial';

        return (
          <div key={payment.id} className="flex gap-3">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <div
                className={clsx(
                  'h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
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
                <div className={clsx(
                  'w-0.5 flex-1 min-h-[16px]',
                  payment.status === 'paid' ? 'bg-emerald-200' : 'bg-slate-200',
                )} />
              )}
            </div>

            {/* Content */}
            <button
              type="button"
              disabled={!isActionable}
              onClick={() => isActionable && onPaymentTap?.(payment)}
              className={clsx(
                'flex-1 rounded-lg border p-3 mb-2 text-left transition-colors',
                isActionable
                  ? 'border-slate-200 hover:border-primary hover:bg-primary/5 cursor-pointer'
                  : 'border-slate-100 cursor-default',
                payment.status === 'overdue' && 'border-red-200 bg-red-50/50',
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">
                  {t('payments.installmentNo', { number: payment.installmentNumber })}
                </span>
                <Badge status={payment.status}>
                  {t(`payments.${payment.status}`)}
                </Badge>
              </div>
              <div className="flex items-center justify-between mt-1">
                <DateDisplay date={payment.dueDate} className="text-xs text-slate-500" />
                <CurrencyDisplay
                  amount={parseFloat(payment.amountDue)}
                  className="text-sm font-semibold text-slate-900"
                />
              </div>
              {payment.status === 'paid' && payment.paidDate && (
                <div className="mt-1 text-xs text-emerald-600">
                  {t('payments.paidDate')}: <DateDisplay date={payment.paidDate} />
                </div>
              )}
              {payment.status === 'partial' && (
                <div className="mt-1 text-xs text-amber-600">
                  {t('payments.amountPaid')}: <CurrencyDisplay amount={parseFloat(payment.amountPaid)} />
                </div>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
