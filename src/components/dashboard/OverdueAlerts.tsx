import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';

interface OverdueAlertsProps {
  count: number;
}

export function OverdueAlerts({ count }: OverdueAlertsProps) {
  const { t } = useTranslation();

  if (count === 0) {
    return (
      <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-center gap-3">
        <span className="text-emerald-600 text-lg font-bold">{'\u2713'}</span>
        <p className="text-sm font-medium text-emerald-700">{t('dashboard.noOverdue')}</p>
      </div>
    );
  }

  return (
    <Link to="/payments" className="block">
      <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-3 hover:bg-red-100/50 transition-colors">
        <span className="text-red-600 text-lg">{'!!'}</span>
        <p className="text-sm font-medium text-red-700 flex-1">
          {t('dashboard.overdueAlert', { count })}
        </p>
        <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
