import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { NameDisplay } from '@/components/shared/NameDisplay';
import { ContactActions } from '@/components/shared/ContactActions';
import { useStore } from '@tanstack/react-store';
import { uiStore } from '@/lib/stores';
import { formatPercent } from '@/lib/formatters';

interface BorrowerData {
  id: string;
  name: string;
  nameTelugu: string | null;
  mobile: string;
  area: string;
  totalPayments: number;
  onTime: number;
  onTimePercent: number;
  totalBorrowed: number;
}

type SortKey = 'name' | 'onTimePercent' | 'totalBorrowed';

export function BorrowerStats({ data }: { data: BorrowerData[] }) {
  const { t } = useTranslation();
  const lang = useStore(uiStore, (s) => s.language);
  const [sortBy, setSortBy] = useState<SortKey>('onTimePercent');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sorted = [...data].sort((a, b) => {
    const mul = sortDir === 'asc' ? 1 : -1;
    if (sortBy === 'name') return mul * a.name.localeCompare(b.name);
    return mul * ((a[sortBy] as number) - (b[sortBy] as number));
  });

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir('desc');
    }
  };

  const sortIcon = (key: SortKey) => {
    if (sortBy !== key) return '';
    return sortDir === 'asc' ? ' \u25B2' : ' \u25BC';
  };

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-slate-100 bg-card shadow-sm p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">{t('analytics.borrowerStats')}</h3>
        <p className="text-sm text-slate-400 py-4 text-center">{t('analytics.noData')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-100 bg-card shadow-sm p-4">
      <h3 className="text-sm font-semibold text-slate-900 mb-3">{t('analytics.borrowerStats')}</h3>

      {/* Mobile: card view */}
      <div className="sm:hidden space-y-2">
        {sorted.map((b) => (
          <div key={b.id} className="rounded-lg border border-slate-100 p-3">
            <div className="flex justify-between items-center mb-1">
              <div className="flex min-w-0 items-center gap-1">
                <NameDisplay name={b.name} nameTelugu={b.nameTelugu} className="truncate font-medium text-sm text-slate-900" />
                <ContactActions mobile={b.mobile} name={b.name} variant="icons" className="-my-2" />
              </div>
              <span className={`text-xs font-semibold ${b.onTimePercent >= 80 ? 'text-emerald-600' : b.onTimePercent >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                {formatPercent(b.onTimePercent, { lang })}
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>{b.area}</span>
              <CurrencyDisplay amount={b.totalBorrowed} className="text-slate-600" />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block overflow-x-auto overscroll-x-contain">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="pb-2 font-medium cursor-pointer" onClick={() => handleSort('name')}>
                {t('borrowers.name')}{sortIcon('name')}
              </th>
              <th className="pb-2 font-medium">{t('borrowers.area')}</th>
              <th className="pb-2 font-medium cursor-pointer text-right" onClick={() => handleSort('onTimePercent')}>
                {t('analytics.onTimeRate')}{sortIcon('onTimePercent')}
              </th>
              <th className="pb-2 font-medium cursor-pointer text-right" onClick={() => handleSort('totalBorrowed')}>
                {t('analytics.amountGiven')}{sortIcon('totalBorrowed')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sorted.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50">
                <td className="py-2 font-medium text-slate-900">
                  <div className="flex items-center gap-1">
                    <NameDisplay name={b.name} nameTelugu={b.nameTelugu} />
                    <ContactActions mobile={b.mobile} name={b.name} variant="icons" className="-my-2" />
                  </div>
                </td>
                <td className="py-2 text-slate-500">{b.area}</td>
                <td className="py-2 text-right">
                  <span className={`font-semibold ${b.onTimePercent >= 80 ? 'text-emerald-600' : b.onTimePercent >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                    {formatPercent(b.onTimePercent, { lang })}
                  </span>
                </td>
                <td className="py-2 text-right">
                  <CurrencyDisplay amount={b.totalBorrowed} className="font-medium" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
