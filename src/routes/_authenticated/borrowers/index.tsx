import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';
import { listBorrowers, listAreas } from '@/server/functions/borrowers';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { BorrowerCard } from '@/components/borrowers/BorrowerCard';
import { BorrowerAvatar } from '@/components/shared/BorrowerAvatar';
import { NameDisplay } from '@/components/shared/NameDisplay';
import { EmptyState } from '@/components/shared/EmptyState';
import { OfflineScreen } from '@/components/shared/OfflineScreen';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { Spinner } from '@/components/ui/Spinner';
import { Pagination } from '@/components/ui/Pagination';
import { InfiniteScroll, EndOfList } from '@/components/ui/InfiniteScroll';
import { usePaginatedList, type PageResult } from '@/lib/usePaginatedList';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { clsx } from 'clsx';
import { ListPage } from '@/components/layout/PageLayout';
import { ListError } from '@/components/shared/ListError';
import { formatPhone } from '@/lib/formatters';
import { useTeluguSearchTerm } from '@/lib/useTeluguSearchTerm';
import { VoiceInput } from '@/components/ui/VoiceInput';

export const Route = createFileRoute('/_authenticated/borrowers/')({
  component: BorrowersPage,
});

function BorrowersPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [area, setArea] = useState('all');
  const [areas, setAreas] = useState<string[]>([]);
  const debouncedSearch = useDebouncedValue(search, 300);
  // Typed in English, this is the Telugu reading of it — searched alongside, and shown
  // in the field so it is clear what else is being looked for.
  const { telugu: teluguTerm, candidates: teluguCandidates } = useTeluguSearchTerm(search);
  // Joined for the debounce and the cache key, which both need a stable primitive.
  const debouncedTelugu = useDebouncedValue(teluguCandidates.join('|'), 300);
  const teluguTerms = debouncedTelugu ? debouncedTelugu.split('|') : [];
  // "No borrowers yet" is only true of an empty ledger. Saying it when a search simply
  // did not match reads as though the data is gone, which is exactly how a slow or
  // unmatched search came across.
  const filtersActive = Boolean(debouncedSearch.trim()) || (area !== 'all' && area !== '');

  type BorrowerItem = {
    id: string;
    name: string;
    nameTelugu: string | null;
    mobile: string;
    area: string | null;
    profilePhotoUrl: string | null;
  };

  const fetchPage = useCallback(
    (p: number, size: number) =>
      listBorrowers({ data: { page: p, limit: size, area, search: debouncedSearch, searchTelugu: teluguTerms } }),
    [area, debouncedSearch, debouncedTelugu],
  );
  const cacheKey = useCallback(
    (p: number, size: number) => `borrowers:${p}:${size}:${area}:${debouncedSearch}:${debouncedTelugu}`,
    [area, debouncedSearch, debouncedTelugu],
  );

  const list = usePaginatedList<BorrowerItem>({
    cacheKey,
    fetchPage: fetchPage as (p: number, size: number) => Promise<PageResult<BorrowerItem>>,
    resetKey: `${area}|${debouncedSearch}|${debouncedTelugu}`,
  });

  const { items, total, showSkeleton, refreshing } = list;

  // Serials continue across pages; mobile accumulates so its offset is always zero.
  const serialStart = list.isDesktop ? (list.page - 1) * list.pageSize : 0;

  useEffect(() => {
    listAreas().then(setAreas).catch(() => setAreas([]));
  }, []);

  return (
    <ListPage
      header={<>
      {/* One line on desktop: the title holds the left, and search, the area filter and the
          action group against the right. Mobile keeps the title with its action and the
          controls beneath, since three of them crush each other at 375px. */}
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
        {/* Dissolved on desktop so both become items of the one row, the action last. */}
        <div className="flex items-center justify-between gap-3 lg:contents">
          <h2 className="truncate text-2xl font-bold text-slate-900 lg:shrink-0">{t('borrowers.title')}</h2>
          <Link to="/borrowers/new" className="shrink-0 lg:order-last">
            <Button size="sm">{t('borrowers.newBorrower')}</Button>
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:contents">
        {/* min-w-0 lets the field shrink instead of forcing the row wider than the screen.
            ml-auto pushes this and everything after it to the right edge. */}
        <div className="min-w-0 flex-1 lg:ml-auto lg:w-60 lg:flex-none xl:w-72">
          <Input
            placeholder={t('common.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            rightSlot={
              <>
                {teluguTerm && (
                  <span
                    className="pointer-events-none max-w-[6rem] truncate rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-brand"
                    title={teluguTerm}
                  >
                    {teluguTerm}
                  </span>
                )}
                {/* Speaking a name searches for it. The reading comes back in Telugu,
                    which is how most of these names are stored. */}
                <VoiceInput size="sm" onResult={setSearch} />
              </>
            }
            className="lg:min-h-10 lg:py-2 lg:text-sm"
            leftIcon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>
        {/* Bounded so a long area name cannot starve the search field. */}
        <div className="w-32 shrink-0 sm:w-40 lg:w-36">
          <Select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="lg:min-h-10 lg:py-2 lg:text-sm"
            options={[
              { value: 'all', label: t('common.all') },
              ...areas.map((a) => ({ value: a, label: a })),
            ]}
          />
        </div>
        </div>
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
          title={filtersActive ? t('common.noMatches') : t('borrowers.noBorrowers')}
          description={filtersActive ? t('common.noMatchesHint') : undefined}
          action={
            <Link to="/borrowers/new">
              <Button>{t('borrowers.newBorrower')}</Button>
            </Link>
          }
        />
      ) : (
        <div className="relative">
          {refreshing && (
            <div className="absolute inset-0 z-10 flex items-start justify-center rounded-2xl bg-card/70 backdrop-blur-[1px] pt-10">
              <span className="flex items-center gap-2 rounded-full bg-card px-3.5 py-2 text-sm font-medium text-slate-600 shadow-md">
                <Spinner size="sm" />
                {t('common.loading')}
              </span>
            </div>
          )}

          <div className={clsx('space-y-4 transition-opacity', refreshing && 'opacity-50')} aria-busy={refreshing}>
          {/* Mobile: card view */}
          <div className="lg:hidden space-y-3 list-container">
            {items.map((b) => (
              <div key={b.id} className="list-row">
                <BorrowerCard
                  id={b.id}
                  name={b.name}
                  nameTelugu={b.nameTelugu}
                  mobile={b.mobile}
                  area={b.area}
                  photoUrl={b.profilePhotoUrl}
                />
              </div>
            ))}
          </div>

          {/* Desktop: table view */}
          <div className="hidden lg:block overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="pb-3 font-medium whitespace-nowrap w-12">{t('common.serial')}</th>
                  <th className="pb-3 font-medium whitespace-nowrap">{t('borrowers.name')}</th>
                  <th className="pb-3 font-medium whitespace-nowrap">{t('borrowers.mobile')}</th>
                  <th className="pb-3 font-medium whitespace-nowrap">{t('borrowers.area')}</th>
                  <th className="pb-3 font-medium whitespace-nowrap">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((b, index) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="py-3 text-sm text-slate-400 tabular-nums">{serialStart + index + 1}</td>
                    <td className="py-3 font-medium text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <BorrowerAvatar name={b.name} nameTelugu={b.nameTelugu} photoUrl={b.profilePhotoUrl} size="sm" />
                        <NameDisplay name={b.name} nameTelugu={b.nameTelugu} />
                      </div>
                    </td>
                    <td className="py-3 text-slate-600">{formatPhone(b.mobile)}</td>
                    <td className="py-3 text-slate-600">{b.area || '—'}</td>
                    <td className="py-3">
                      <Link
                        to="/borrowers/$borrowerId"
                        params={{ borrowerId: b.id }}
                        className="text-brand hover:underline text-sm"
                      >
                        {t('common.viewAll')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
