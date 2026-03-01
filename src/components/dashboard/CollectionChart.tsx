import { useTranslation } from 'react-i18next';
import { useStore } from '@tanstack/react-store';
import { uiStore } from '@/lib/stores';
import { formatINRCompact, formatMonthYear } from '@/lib/formatters';

interface CashflowData {
  month: string;
  collections: number;
  disbursements: number;
}

export function CollectionChart({ data }: { data: CashflowData[] }) {
  const { t } = useTranslation();
  const lang = useStore(uiStore, (s) => s.language);

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-slate-100 bg-white shadow-sm p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">{t('analytics.capitalFlow')}</h3>
        <p className="text-sm text-slate-400 py-8 text-center">{t('analytics.noData')}</p>
      </div>
    );
  }

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.collections, d.disbursements)),
    1,
  );
  const chartHeight = 160;

  return (
    <div className="rounded-xl border border-slate-100 bg-white shadow-sm p-4">
      <h3 className="text-sm font-semibold text-slate-900 mb-3">{t('analytics.capitalFlow')}</h3>

      {/* Legend */}
      <div className="flex gap-4 mb-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-emerald-500" />
          <span className="text-slate-500">{t('analytics.collections')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-red-400" />
          <span className="text-slate-500">{t('analytics.disbursements')}</span>
        </div>
      </div>

      {/* SVG Bar Chart */}
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${Math.max(data.length * 80, 320)} ${chartHeight + 40}`}
          className="w-full min-w-[320px]"
          style={{ height: chartHeight + 40 }}
        >
          {data.map((d, i) => {
            const x = i * 80 + 20;
            const barWidth = 24;
            const collH = (d.collections / maxVal) * chartHeight;
            const disbH = (d.disbursements / maxVal) * chartHeight;

            const monthDate = new Date(d.month + '-01');
            const monthLabel = formatMonthYear(monthDate, { lang }).split(' ')[0].slice(0, 3);

            return (
              <g key={d.month}>
                {/* Collection bar */}
                <rect
                  x={x}
                  y={chartHeight - collH}
                  width={barWidth}
                  height={collH}
                  rx={4}
                  className="fill-emerald-500"
                />
                {/* Disbursement bar */}
                <rect
                  x={x + barWidth + 4}
                  y={chartHeight - disbH}
                  width={barWidth}
                  height={disbH}
                  rx={4}
                  className="fill-red-400"
                />
                {/* Month label */}
                <text
                  x={x + barWidth + 2}
                  y={chartHeight + 16}
                  textAnchor="middle"
                  className="fill-slate-400 text-[10px]"
                >
                  {monthLabel}
                </text>
              </g>
            );
          })}
          {/* Baseline */}
          <line
            x1="0"
            y1={chartHeight}
            x2={data.length * 80 + 20}
            y2={chartHeight}
            className="stroke-slate-200"
            strokeWidth={1}
          />
        </svg>
      </div>

      {/* Y-axis hint */}
      <div className="flex justify-between text-xs text-slate-400 mt-1">
        <span>0</span>
        <span>{formatINRCompact(maxVal, { lang })}</span>
      </div>
    </div>
  );
}
