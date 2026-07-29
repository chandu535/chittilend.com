import { useTranslation } from 'react-i18next';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';

interface AreaData {
  area: string;
  loanCount: number;
  borrowerCount: number;
  totalLent: number;
  defaults: number;
}

export function AreaBreakdown({ data }: { data: AreaData[] }) {
  const { t } = useTranslation();

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-slate-100 bg-card shadow-sm p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">{t('analytics.areaBreakdown')}</h3>
        <p className="text-sm text-slate-400 py-4 text-center">{t('analytics.noData')}</p>
      </div>
    );
  }

  const maxLent = Math.max(...data.map((d) => d.totalLent), 1);

  return (
    <div className="rounded-xl border border-slate-100 bg-card shadow-sm p-4">
      <h3 className="text-sm font-semibold text-slate-900 mb-3">{t('analytics.areaBreakdown')}</h3>
      <div className="space-y-3">
        {data.map((d) => (
          <div key={d.area}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-medium text-slate-700 truncate">{d.area}</span>
              <CurrencyDisplay amount={d.totalLent} className="font-semibold text-slate-900 shrink-0" />
            </div>
            {/* Bar */}
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(d.totalLent / maxLent) * 100}%` }}
              />
            </div>
            <div className="flex gap-3 mt-1 text-xs text-slate-400">
              <span>{d.loanCount} {t('nav.loans').toLowerCase()}</span>
              <span>{d.borrowerCount} {t('nav.borrowers').toLowerCase()}</span>
              {d.defaults > 0 && (
                <span className="text-red-500">{d.defaults} {t('loans.statusDefaulted').toLowerCase()}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
