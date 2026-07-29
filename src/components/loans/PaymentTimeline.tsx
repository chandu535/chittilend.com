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
  paymentMethod?: string | null;
  notes?: string | null;
}

interface PaymentTimelineProps {
  payments: Payment[];
  onPaymentTap?: (payment: Payment) => void;
}

function daysSince(dateStr: string): number {
  const due = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - due.getTime()) / 86400000);
}

const methodLabel: Record<string, string> = {
  cash: 'Cash',
  upi: 'UPI',
  bank_transfer: 'Bank Transfer',
  other: 'Other',
};

export function PaymentTimeline({ payments, onPaymentTap }: PaymentTimelineProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-0">
      {payments.map((payment, index) => {
        const isLast = index === payments.length - 1;
        const overdueDays = payment.status === 'overdue' ? daysSince(payment.dueDate) : 0;
        const remaining = parseFloat(payment.amountDue) - parseFloat(payment.amountPaid);

        return (
          <div key={payment.id} className="flex gap-3">
            {/* Timeline dot + line */}
            <div className="flex flex-col items-center">
              <div
                className={clsx(
                  'h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
                  payment.status === 'paid' && 'bg-emerald-100 text-emerald-700',
                  payment.status === 'overdue' && 'bg-red-100 text-red-700',
                  payment.status === 'partial' && 'bg-amber-100 text-amber-700',
                  payment.status === 'waived' && 'bg-primary/15 text-brand',
                  payment.status === 'pending' && 'bg-slate-100 text-slate-400',
                )}
              >
                {payment.status === 'paid' && '✓'}
                {payment.status === 'pending' && '○'}
                {payment.status === 'overdue' && '●'}
                {payment.status === 'partial' && '◑'}
                {payment.status === 'waived' && '—'}
              </div>
              {!isLast && (
                <div
                  className={clsx(
                    'w-0.5 flex-1 min-h-[16px]',
                    payment.status === 'paid' || payment.status === 'waived'
                      ? 'bg-emerald-200'
                      : 'bg-slate-200',
                  )}
                />
              )}
            </div>

            {/* Content card */}
            <button
              type="button"
              onClick={() => onPaymentTap?.(payment)}
              className={clsx(
                'flex-1 rounded-lg border p-3 mb-2 text-left transition-colors active:opacity-75',
                'border-slate-200 hover:border-brand hover:bg-primary/5 cursor-pointer',
                payment.status === 'overdue' && 'border-red-200 bg-red-50/60',
                payment.status === 'partial' && 'border-amber-200 bg-amber-50/40',
                payment.status === 'paid' && 'border-emerald-100',
                payment.status === 'waived' && 'border-brand/20 bg-primary/5',
              )}
            >
              {/* Top row: installment label + badge */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">
                  {t('payments.installmentNo', { number: payment.installmentNumber })}
                </span>
                <Badge status={payment.status}>
                  {t(`payments.${payment.status}`)}
                </Badge>
              </div>

              {/* Second row: due date + amount due */}
              <div className="flex items-center justify-between mt-1">
                <DateDisplay date={payment.dueDate} className="text-xs text-slate-500" />
                <CurrencyDisplay
                  amount={parseFloat(payment.amountDue)}
                  className="text-sm font-semibold text-slate-900"
                />
              </div>

              {/* Paid: date + method */}
              {payment.status === 'paid' && payment.paidDate && (
                <div className="mt-1.5 flex items-center gap-2 text-xs text-emerald-700">
                  <span>✓ Paid on</span>
                  <DateDisplay date={payment.paidDate} />
                  {payment.paymentMethod && (
                    <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                      {methodLabel[payment.paymentMethod] ?? payment.paymentMethod}
                    </span>
                  )}
                </div>
              )}

              {/* Partial: paid + remaining */}
              {payment.status === 'partial' && (
                <div className="mt-1.5 space-y-0.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-700">Paid so far</span>
                    <CurrencyDisplay amount={parseFloat(payment.amountPaid)} className="text-amber-700 font-medium" />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Still due</span>
                    <CurrencyDisplay amount={remaining} className="text-slate-700 font-semibold" />
                  </div>
                </div>
              )}

              {/* Overdue: days count */}
              {payment.status === 'overdue' && overdueDays > 0 && (
                <div className="mt-1 text-xs font-semibold text-red-600">
                  {t('loans.daysOverdue', { count: overdueDays })}
                </div>
              )}

              {/* Waived: reason from notes */}
              {payment.status === 'waived' && (
                <div className="mt-1 text-xs text-brand">
                  {payment.notes ? `Reason: ${payment.notes}` : 'Waived'}
                </div>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
