import { useTranslation } from 'react-i18next';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';

interface SummaryData {
  totalDeployed: number;
  availableCapital: number;
  toCollect: number;
  profitEarned: number;
}

const icons = {
  deployed: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  available: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  ),
  collect: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75" />
    </svg>
  ),
  profit: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  ),
};

const cardConfig = [
  // Money out is the house's own colour; money earned is the gold. The two middle tiles
  // stay on the status hues because that is what they are — cash on hand is healthy, cash
  // owed is a thing to watch — and reading them as status is the point.
  { key: 'deployed', labelKey: 'dashboard.totalDeployed', icon: icons.deployed, colorClass: 'bg-primary/10 text-brand' },
  { key: 'available', labelKey: 'dashboard.availableCapital', icon: icons.available, colorClass: 'bg-emerald-50 text-emerald-600' },
  { key: 'collect', labelKey: 'dashboard.toCollect', icon: icons.collect, colorClass: 'bg-amber-50 text-amber-600' },
  { key: 'profit', labelKey: 'dashboard.profitEarned', icon: icons.profit, colorClass: 'bg-gold-soft text-brand' },
] as const;

const valueMap: Record<string, keyof SummaryData> = {
  deployed: 'totalDeployed',
  available: 'availableCapital',
  collect: 'toCollect',
  profit: 'profitEarned',
};

export function SummaryCards({ data }: { data: SummaryData }) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 gap-3">
      {cardConfig.map((card) => (
        <div
          key={card.key}
          className="rounded-xl border border-slate-100 bg-card p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`rounded-lg p-1.5 ${card.colorClass}`}>
              {card.icon}
            </div>
          </div>
          <CurrencyDisplay
            amount={data[valueMap[card.key]]}
            className="text-xl font-bold text-slate-900"
          />
          <p className="text-xs text-slate-500 mt-1">{t(card.labelKey)}</p>
        </div>
      ))}
    </div>
  );
}
