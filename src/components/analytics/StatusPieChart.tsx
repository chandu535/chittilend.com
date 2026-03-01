import { useTranslation } from 'react-i18next';
import { useStore } from '@tanstack/react-store';
import { uiStore } from '@/lib/stores';
import { formatNumber } from '@/lib/formatters';

interface StatusData {
  status: string;
  count: number;
}

const statusColors: Record<string, string> = {
  active: '#3b82f6',
  completed: '#10b981',
  defaulted: '#ef4444',
  extended: '#f59e0b',
};

export function StatusPieChart({ data }: { data: StatusData[] }) {
  const { t } = useTranslation();
  const lang = useStore(uiStore, (s) => s.language);

  const total = data.reduce((sum, d) => sum + d.count, 0);
  if (total === 0) {
    return (
      <div className="rounded-xl border border-slate-100 bg-white shadow-sm p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">{t('analytics.loanStatus')}</h3>
        <p className="text-sm text-slate-400 py-4 text-center">{t('analytics.noData')}</p>
      </div>
    );
  }

  // Build SVG donut segments
  const size = 120;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const segments = data
    .filter((d) => d.count > 0)
    .map((d) => {
      const pct = d.count / total;
      const dashLength = pct * circumference;
      const dashOffset = -offset;
      offset += dashLength;
      return {
        ...d,
        pct,
        dashLength,
        dashOffset,
        color: statusColors[d.status] || '#94a3b8',
      };
    });

  return (
    <div className="rounded-xl border border-slate-100 bg-white shadow-sm p-4">
      <h3 className="text-sm font-semibold text-slate-900 mb-3">{t('analytics.loanStatus')}</h3>

      <div className="flex items-center gap-6">
        {/* Donut */}
        <div className="relative shrink-0">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {segments.map((seg) => (
              <circle
                key={seg.status}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${seg.dashLength} ${circumference - seg.dashLength}`}
                strokeDashoffset={seg.dashOffset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-slate-900">
              {formatNumber(total, { lang })}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2 flex-1">
          {segments.map((seg) => (
            <div key={seg.status} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-sm shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-xs text-slate-600 flex-1">
                {t(`loans.status${seg.status.charAt(0).toUpperCase() + seg.status.slice(1)}`)}
              </span>
              <span className="text-xs font-semibold text-slate-900">
                {formatNumber(seg.count, { lang })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
