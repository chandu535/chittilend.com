import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  disabled?: boolean;
}

/**
 * Visible page list with gaps, e.g. 1 2 3 4 … 216.
 * The last page is always shown so the end of the range is one click away.
 */
function pageWindow(page: number, totalPages: number): Array<number | 'gap'> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const pages = new Set<number>([1, totalPages, page]);
  for (const offset of [-1, 1]) {
    const candidate = page + offset;
    if (candidate > 1 && candidate < totalPages) pages.add(candidate);
  }
  // Keep a constant width near the ends so the strip does not jump about.
  if (page <= 3) [2, 3, 4].forEach((p) => p < totalPages && pages.add(p));
  if (page >= totalPages - 2) {
    [totalPages - 3, totalPages - 2, totalPages - 1].forEach((p) => p > 1 && pages.add(p));
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const withGaps: Array<number | 'gap'> = [];
  sorted.forEach((value, index) => {
    if (index > 0 && value - sorted[index - 1] > 1) withGaps.push('gap');
    withGaps.push(value);
  });
  return withGaps;
}

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  disabled = false,
}: PaginationProps) {
  const { t } = useTranslation();
  const [goTo, setGoTo] = useState(String(page));

  // Keep the box in step when the page changes by any other means.
  useEffect(() => { setGoTo(String(page)); }, [page]);

  if (totalPages <= 1 && !onPageSizeChange) return null;

  const commitGoTo = () => {
    const target = Number(goTo);
    if (!Number.isInteger(target) || target < 1 || target > totalPages) {
      setGoTo(String(page));
      return;
    }
    onChange(target);
  };

  return (
    <nav
      aria-label={t('common.pagination')}
      className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-2xl border border-slate-100 bg-card px-4 py-3"
    >
      {/* Left: total + rows per page */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-600 tabular-nums whitespace-nowrap">
          {t('common.totalCount', { count: total })}
        </span>

        {onPageSizeChange && (
          <div className="relative">
            <select
              value={pageSize}
              disabled={disabled}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label={t('common.rowsPerPage')}
              className={clsx(
                'appearance-none rounded-lg border border-slate-200 bg-card',
                'py-1.5 pl-3 pr-8 text-sm text-slate-700 tabular-nums',
                'hover:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
                disabled && 'opacity-50 cursor-not-allowed',
              )}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>{t('common.perPage', { count: size })}</option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </div>

      {/* Right: go-to + page controls */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <label htmlFor="pagination-goto" className="text-sm text-slate-500 whitespace-nowrap">
              {t('common.goTo')}
            </label>
            <input
              id="pagination-goto"
              value={goTo}
              disabled={disabled}
              inputMode="numeric"
              onChange={(e) => setGoTo(e.target.value.replace(/\D/g, ''))}
              onBlur={commitGoTo}
              onKeyDown={(e) => { if (e.key === 'Enter') commitGoTo(); }}
              className={clsx(
                'h-9 w-14 rounded-lg border border-slate-200 bg-slate-50 text-center',
                'text-sm text-slate-700 tabular-nums',
                'focus:bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
                disabled && 'opacity-50',
              )}
            />
          </div>

          <Step
            label={t('common.previous')}
            direction="prev"
            onClick={() => onChange(page - 1)}
            disabled={disabled || page === 1}
          />

          <div className="flex items-center gap-1">
            {pageWindow(page, totalPages).map((entry, index) =>
              entry === 'gap' ? (
                <span key={`gap-${index}`} className="px-1 text-slate-400 select-none">…</span>
              ) : (
                <button
                  key={entry}
                  type="button"
                  onClick={() => onChange(entry)}
                  disabled={disabled}
                  aria-current={entry === page ? 'page' : undefined}
                  className={clsx(
                    'h-9 min-w-9 rounded-lg border px-2 text-sm font-medium tabular-nums transition-colors',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
                    entry === page
                      ? 'border-brand bg-primary text-white'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                    disabled && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  {entry}
                </button>
              ),
            )}
          </div>

          <Step
            label={t('common.next')}
            direction="next"
            onClick={() => onChange(page + 1)}
            disabled={disabled || page === totalPages}
          />
        </div>
      )}
    </nav>
  );
}

function Step({
  label,
  direction,
  onClick,
  disabled,
}: {
  label: string;
  direction: 'prev' | 'next';
  onClick: () => void;
  disabled: boolean;
}) {
  const chevron = (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d={direction === 'prev' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'}
      />
    </svg>
  );

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'flex h-9 items-center gap-1 rounded-lg px-2 text-sm font-medium transition-colors',
        'text-slate-600 hover:bg-slate-100',
        'disabled:text-slate-400 disabled:hover:bg-transparent disabled:cursor-not-allowed',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
      )}
    >
      {direction === 'prev' && chevron}
      <span className="hidden sm:inline">{label}</span>
      {direction === 'next' && chevron}
    </button>
  );
}
