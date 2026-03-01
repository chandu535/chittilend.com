import { useTranslation } from 'react-i18next';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { useStore } from '@tanstack/react-store';
import { uiStore } from '@/lib/stores';
import { formatNumber, formatMonthYear } from '@/lib/formatters';

interface SnapshotData {
  month: number;
  year: number;
  loansGivenCount: number;
  loansGivenAmount: number;
  collected: number;
  newBorrowers: number;
}

interface MonthlySnapshotProps {
  current: SnapshotData | null;
  previous: SnapshotData | null;
}

export function MonthlySnapshot({ current, previous }: MonthlySnapshotProps) {
  const { t } = useTranslation();
  const lang = useStore(uiStore, (s) => s.language);

  if (!current) return null;

  const rows: { label: string; currentVal: string; prevVal: string; isCurrency?: boolean }[] = [
    {
      label: t('analytics.amountGiven'),
      currentVal: '',
      prevVal: '',
      isCurrency: true,
    },
    {
      label: t('analytics.amountCollected'),
      currentVal: '',
      prevVal: '',
      isCurrency: true,
    },
    {
      label: t('analytics.totalLoans'),
      currentVal: formatNumber(current.loansGivenCount, { lang }),
      prevVal: previous ? formatNumber(previous.loansGivenCount, { lang }) : '—',
    },
    {
      label: t('borrowers.newBorrower'),
      currentVal: formatNumber(current.newBorrowers, { lang }),
      prevVal: previous ? formatNumber(previous.newBorrowers, { lang }) : '—',
    },
  ];

  const currentDate = new Date(current.year, current.month - 1, 1);
  const prevDate = previous ? new Date(previous.year, previous.month - 1, 1) : null;

  return (
    <div className="rounded-xl border border-slate-100 bg-white shadow-sm p-4">
      <h3 className="text-sm font-semibold text-slate-900 mb-3">{t('analytics.monthlyComparison')}</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500">
            <th className="pb-2 text-left font-medium"></th>
            <th className="pb-2 text-right font-medium">
              {formatMonthYear(currentDate, { lang })}
            </th>
            <th className="pb-2 text-right font-medium">
              {prevDate ? formatMonthYear(prevDate, { lang }) : '—'}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          <tr>
            <td className="py-2 text-slate-600">{t('analytics.amountGiven')}</td>
            <td className="py-2 text-right">
              <CurrencyDisplay amount={current.loansGivenAmount} className="font-medium" />
            </td>
            <td className="py-2 text-right text-slate-400">
              {previous ? <CurrencyDisplay amount={previous.loansGivenAmount} /> : '—'}
            </td>
          </tr>
          <tr>
            <td className="py-2 text-slate-600">{t('analytics.amountCollected')}</td>
            <td className="py-2 text-right">
              <CurrencyDisplay amount={current.collected} className="font-medium" />
            </td>
            <td className="py-2 text-right text-slate-400">
              {previous ? <CurrencyDisplay amount={previous.collected} /> : '—'}
            </td>
          </tr>
          <tr>
            <td className="py-2 text-slate-600">{t('analytics.totalLoans')}</td>
            <td className="py-2 text-right font-medium">{rows[2].currentVal}</td>
            <td className="py-2 text-right text-slate-400">{rows[2].prevVal}</td>
          </tr>
          <tr>
            <td className="py-2 text-slate-600">{t('borrowers.newBorrower')}</td>
            <td className="py-2 text-right font-medium">{rows[3].currentVal}</td>
            <td className="py-2 text-right text-slate-400">{rows[3].prevVal}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
