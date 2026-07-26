import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useState, useCallback, useMemo } from 'react';
import { listLoans } from '@/server/functions/loans';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { LoanCard } from '@/components/loans/LoanCard';
import { BorrowerAvatar } from '@/components/shared/BorrowerAvatar';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { NameDisplay } from '@/components/shared/NameDisplay';
import { EmptyState } from '@/components/shared/EmptyState';
import { OfflineScreen } from '@/components/shared/OfflineScreen';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { Pagination } from '@/components/ui/Pagination';
import { InfiniteScroll, EndOfList } from '@/components/ui/InfiniteScroll';
import { usePaginatedList, type PageResult } from '@/lib/usePaginatedList';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { clsx } from 'clsx';
import { ListPage } from '@/components/layout/PageLayout';
import { ListError } from '@/components/shared/ListError';

export const Route = createFileRoute('/_authenticated/loans/')({
  component: LoansPage,
});

type NextPayment = {
  id: string;
  installmentNumber: number;
  dueDate: string;
  amountDue: string;
  amountPaid: string;
  status: 'pending' | 'partial' | 'overdue';
};

type LoanItem = {
  id: string;
  loanNumber: number;
  borrowerName: string;
  borrowerNameTelugu: string | null;
  borrowerMobile: string;
  borrowerArea: string | null;
  borrowerPhotoUrl: string | null;
  nextPayment: NextPayment | null;
  primaryAmount: string;
  totalRepayment: string;
  paidAmount: string;
  status: 'active' | 'completed' | 'defaulted' | 'extended';
  tenureMonths: number;
  totalInstallments: number;
  paidInstallments: number;
  dateGiven: string;
};

function isToday(dateStr: string): boolean {
  const today = new Date();
  const d = new Date(dateStr + 'T00:00:00');
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

function loanDisplayPriority(loan: LoanItem): number {
  if (loan.status === 'completed') return 3;
  if (!loan.nextPayment) return 2;

  const today = new Date();
  const endOfCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const dueDate = new Date(loan.nextPayment.dueDate + 'T00:00:00');
  if (dueDate <= endOfCurrentMonth) return 0;

  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  if (new Date(loan.dateGiven + 'T00:00:00') < currentMonthStart) return 2;
  return 1;
}

function LoansPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  // Debounced so typing does not fire a request per keystroke.
  const debouncedSearch = useDebouncedValue(search, 300);

  const fetchPage = useCallback(
    (p: number, size: number) => listLoans({ data: { page: p, limit: size, status, search: debouncedSearch } }),
    [status, debouncedSearch],
  );
  const cacheKey = useCallback(
    (p: number, size: number) => `loans:${p}:${size}:${status}:${debouncedSearch}`,
    [status, debouncedSearch],
  );

  const list = usePaginatedList<LoanItem>({
    cacheKey,
    fetchPage: fetchPage as (p: number, size: number) => Promise<PageResult<LoanItem>>,
    resetKey: `${status}|${debouncedSearch}`,
  });

  const { items, total, showSkeleton, refreshing } = list;

  // Serial numbers continue across pages: row 11 on page 2 reads 11, not 1.
  // On mobile the pages accumulate, so the offset is always zero there.
  const serialStart = list.isDesktop ? (list.page - 1) * list.pageSize : 0;

  // Per-status totals from the server. They ignore the selected status, so switching
  // chips never changes the numbers on the other chips.
  const statusCounts = (list.meta.statusCounts ?? {}) as Partial<Record<string, number>>;

  // Memoised because infinite scroll can accumulate hundreds of rows: without this, a
  // full scan plus a sort would run on every render, including every keystroke.
  const { overdueCount, dueTodayCount } = useMemo(() => {
    let overdue = 0;
    let dueToday = 0;
    for (const loan of items) {
      if (!loan.nextPayment) continue;
      if (loan.nextPayment.status === 'overdue') overdue++;
      else if (isToday(loan.nextPayment.dueDate)) dueToday++;
    }
    return { overdueCount: overdue, dueTodayCount: dueToday };
  }, [items]);

  const statusOptions = [
    { value: 'all', label: t('common.all') },
    { value: 'active', label: t('loans.statusActive') },
    { value: 'completed', label: t('loans.statusCompleted') },
    { value: 'defaulted', label: t('loans.statusDefaulted') },
    { value: 'extended', label: t('loans.statusExtended') },
  ];
  const sortedLoans = useMemo(() => {
    // Precompute the priority so the comparator does not recalculate dates O(n log n) times.
    return items
      .map((loan) => ({ loan, priority: loanDisplayPriority(loan) }))
      .sort((a, b) => (a.priority - b.priority) || (a.loan.loanNumber - b.loan.loanNumber))
      .map((entry) => entry.loan);
  }, [items]);

  return (
    <ListPage
      header={<>
      {/* Title row */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[22px] font-semibold text-slate-900 tracking-tight">{t('loans.title')}</h2>
        <Link to="/loans/new">
          <Button size="sm">{t('loans.newLoan')}</Button>
        </Link>
      </div>

      {/* Controls. Stacked on mobile; a single row on desktop so the filters do not
          eat vertical space that belongs to the list. */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
        <div className="lg:w-64 lg:shrink-0 xl:w-72">
          <Input
            placeholder={t('common.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="lg:min-h-10 lg:py-2 lg:text-sm"
            leftIcon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>

        {/* The selected chip is the only filled one, so the active filter reads at a glance. */}
        <div
          role="group"
          aria-label={t('common.status')}
          className="flex items-center gap-2 overflow-x-auto overscroll-x-contain lg:min-w-0 lg:flex-1 lg:flex-wrap lg:overflow-visible"
        >
          {statusOptions.map((option) => (
            <FilterChip
              key={option.value}
              label={option.label}
              count={statusCounts[option.value]}
              selected={status === option.value}
              onClick={() => setStatus(option.value)}
            />
          ))}
        </div>

        {/* Read-only counts. Not filters — the list cannot be narrowed to them. */}
        {(overdueCount > 0 || dueTodayCount > 0) && (
          <div className="flex shrink-0 items-center gap-3 whitespace-nowrap text-xs">
            {overdueCount > 0 && (
              <span className="flex items-center gap-1.5 text-red-600">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                {overdueCount} overdue
              </span>
            )}
            {dueTodayCount > 0 && (
              <span className="flex items-center gap-1.5 text-amber-600">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                {dueTodayCount} due today
              </span>
            )}
          </div>
        )}
      </div>
      </>}
      footer={list.isDesktop && list.totalPages > 1 ? (
        <Pagination
          page={list.page}
          totalPages={list.totalPages}
          total={total}
          pageSize={list.pageSize}
          onChange={list.goToPage}
          onPageSizeChange={list.setPageSize}
          disabled={refreshing}
        />
      ) : undefined}
    >
      {showSkeleton ? (
        <PageSkeleton variant="table" />
      ) : list.offline && items.length === 0 ? (
        <OfflineScreen onRetry={list.refresh} />
      ) : list.failed && items.length === 0 ? (
        <ListError message={list.errorMessage} onRetry={list.refresh} />
      ) : items.length === 0 ? (
        <EmptyState
          title={t('loans.noLoans')}
          action={
            <Link to="/loans/new">
              <Button>{t('loans.newLoan')}</Button>
            </Link>
          }
        />
      ) : (
        /* Refetching keeps the current results on screen under a dimming overlay, so
           changing a filter never collapses the page back to a skeleton. */
        <div className="relative">
          {refreshing && (
            <div className="absolute inset-0 z-10 flex items-start justify-center rounded-2xl bg-white/60 backdrop-blur-[1px] pt-10">
              <span className="flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-sm font-medium text-slate-600 shadow-md">
                <Spinner size="sm" />
                {t('common.loading')}
              </span>
            </div>
          )}

          <div className={clsx('space-y-4 transition-opacity', refreshing && 'opacity-50')} aria-busy={refreshing}>
          {/* Phone and tablet portrait: card view */}
          <div className="lg:hidden space-y-3 list-container">
            {sortedLoans.map((loan) => (
              <div key={loan.id} className="list-row">
                <LoanCard
                  id={loan.id}
                  loanNumber={loan.loanNumber}
                  borrowerName={loan.borrowerName}
                  borrowerPhotoUrl={loan.borrowerPhotoUrl}
                  nextPayment={loan.nextPayment}
                  primaryAmount={loan.primaryAmount}
                  totalRepayment={loan.totalRepayment}
                  paidAmount={loan.paidAmount}
                  status={loan.status}
                  totalInstallments={loan.totalInstallments}
                  paidInstallments={loan.paidInstallments}
                  dateGiven={loan.dateGiven}
                />
              </div>
            ))}
          </div>

          {/* Desktop: table view */}
          <div className="hidden lg:block overflow-x-auto overscroll-x-contain rounded-2xl border border-slate-100 bg-white">
            <table className="w-full min-w-[880px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3 font-semibold whitespace-nowrap w-12">{t('common.serial')}</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap w-20">{t('loans.loanNo')}</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">{t('borrowers.name')}</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">{t('loans.primaryAmount')}</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">{t('common.status')}</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Progress</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Next Payment</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sortedLoans.map((loan, index) => {
                  const progress = parseFloat(loan.totalRepayment) > 0
                    ? Math.round((parseFloat(loan.paidAmount) / parseFloat(loan.totalRepayment)) * 100)
                    : 0;
                  const nextOverdue = loan.nextPayment?.status === 'overdue';
                  const nextPartial = loan.nextPayment?.status === 'partial';

                  return (
                    <tr key={loan.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-400 tabular-nums">{serialStart + index + 1}</td>
                      <td className="px-4 py-3 text-lg text-slate-500 font-bold tabular-nums">#{loan.loanNumber}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <BorrowerAvatar name={loan.borrowerName} photoUrl={loan.borrowerPhotoUrl} size="sm" />
                          <div>
                            <NameDisplay name={loan.borrowerName} nameTelugu={loan.borrowerNameTelugu} className="font-medium text-slate-900" />
                            {loan.borrowerArea && (
                              <p className="text-xs text-slate-400">{loan.borrowerArea}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <CurrencyDisplay amount={parseFloat(loan.primaryAmount)} className="font-semibold text-slate-900" />
                      </td>
                      <td className="px-4 py-3">
                        <Badge status={loan.status}>
                          {t(`loans.status${loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}`)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 min-w-[140px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={clsx(
                                'h-full rounded-full',
                                loan.status === 'completed' ? 'bg-emerald-500' : 'bg-primary',
                              )}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500 tabular-nums w-8 text-right">{progress}%</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{loan.paidInstallments}/{loan.totalInstallments}</p>
                      </td>
                      <td className="px-4 py-3">
                        {loan.nextPayment ? (
                          <div>
                            <span className={clsx(
                              'text-xs font-semibold',
                              nextOverdue ? 'text-red-600' : nextPartial ? 'text-amber-600' : 'text-slate-700',
                            )}>
                              {new Date(loan.nextPayment.dueDate + 'T00:00:00').toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short',
                              })}
                            </span>
                            <CurrencyDisplay
                              amount={parseFloat(loan.nextPayment.amountDue)}
                              className="text-xs text-slate-500 block"
                            />
                          </div>
                        ) : loan.status === 'completed' ? (
                          <span className="text-xs text-emerald-600 font-medium">All paid</span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to="/loans/$loanId"
                          params={{ loanId: loan.id }}
                          className="text-primary hover:underline text-sm font-medium"
                        >
                          {t('loans.loanDetails')} →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile keeps scrolling; desktop pages from the pinned footer. */}
          {!list.isDesktop && (list.hasMore ? (
            <InfiniteScroll
              onLoadMore={list.loadMore}
              hasMore={list.hasMore}
              loading={list.appending}
            />
          ) : (
            total > list.pageSize && <EndOfList count={items.length} />
          ))}
          </div>
        </div>
      )}
    </ListPage>
  );
}

function FilterChip({
  label,
  count,
  selected,
  onClick,
}: {
  label: string;
  count?: number;
  selected: boolean;
  onClick: () => void;
}) {
  const empty = count === 0;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={clsx(
        'shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2',
        'text-sm font-medium transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        selected
          ? 'border-primary bg-primary text-white'
          : empty
            // Still selectable — an empty result is a legitimate answer — but muted so
            // the eye goes to the filters that would actually return something.
            ? 'border-slate-100 bg-white text-slate-300 hover:text-slate-500'
            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
      )}
    >
      {label}
      {count !== undefined && (
        <span
          className={clsx(
            'rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
            selected ? 'bg-white/20 text-white'
              : empty ? 'bg-slate-50 text-slate-300'
                : 'bg-slate-100 text-slate-500',
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
