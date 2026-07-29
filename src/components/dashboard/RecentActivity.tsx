import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { DateDisplay } from '@/components/shared/DateDisplay';
import { NameDisplay } from '@/components/shared/NameDisplay';

interface ActivityItem {
  id: string;
  eventDate: Date | string;
  eventType: 'investment' | 'collection' | 'disbursement';
  amount: number;
  loanId: string | null;
  borrowerName: string | null;
  borrowerNameTelugu: string | null;
}

const eventIcons: Record<string, { icon: string; color: string }> = {
  collection: { icon: '\u2193', color: 'bg-emerald-100 text-emerald-700' },
  disbursement: { icon: '\u2191', color: 'bg-red-100 text-red-700' },
  investment: { icon: '+', color: 'bg-primary/15 text-brand' },
};

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  const { t } = useTranslation();

  if (items.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-100 bg-card shadow-sm">
      <div className="px-4 py-3 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-900">{t('dashboard.recentActivity')}</h3>
      </div>
      <div className="divide-y divide-slate-50">
        {items.map((item) => {
          const cfg = eventIcons[item.eventType];
          const dateStr = typeof item.eventDate === 'string'
            ? item.eventDate
            : new Date(item.eventDate).toISOString().split('T')[0];

          return (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${cfg.color}`}>
                {cfg.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">
                  {t(`capital.${item.eventType}`)}
                  {item.borrowerName && (
                    <span className="text-slate-400"> — <NameDisplay name={item.borrowerName} nameTelugu={item.borrowerNameTelugu} /></span>
                  )}
                </p>
                <DateDisplay date={dateStr} className="text-xs text-slate-400" />
              </div>
              <div className="text-right shrink-0">
                <CurrencyDisplay
                  amount={item.amount}
                  className={`text-sm font-semibold ${
                    item.eventType === 'disbursement' ? 'text-red-600' : 'text-emerald-600'
                  }`}
                />
                {item.loanId && (
                  <Link
                    to="/loans/$loanId"
                    params={{ loanId: item.loanId }}
                    className="text-xs text-brand hover:underline block"
                  >
                    {t('loans.loanDetails')}
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
