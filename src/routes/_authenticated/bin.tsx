import { createFileRoute, redirect } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useCallback, useState } from 'react';
import { clsx } from 'clsx';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { Pagination } from '@/components/ui/Pagination';
import { InfiniteScroll, EndOfList } from '@/components/ui/InfiniteScroll';
import { Spinner } from '@/components/ui/Spinner';
import { ListPage } from '@/components/layout/PageLayout';
import { EmptyState } from '@/components/shared/EmptyState';
import { OfflineScreen } from '@/components/shared/OfflineScreen';
import { ListError } from '@/components/shared/ListError';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { DateDisplay } from '@/components/shared/DateDisplay';
import { NameDisplay } from '@/components/shared/NameDisplay';
import { BorrowerAvatar } from '@/components/shared/BorrowerAvatar';
import { ContactActions } from '@/components/shared/ContactActions';
import { BinActions } from '@/components/bin/BinActions';
import { usePaginatedList, type PageResult } from '@/lib/usePaginatedList';
import { formatPhone } from '@/lib/formatters';
import { can } from '@/lib/permissions';
import {
  canPurgeBorrower,
  canPurgeLoan,
  canRestoreBorrower,
  canRestoreLoan,
  type BorrowerFacts,
} from '@/lib/binRules';
import { useStore } from '@tanstack/react-store';
import { authStore } from '@/lib/stores';
import { listBinnedBorrowers, listBinnedLoans } from '@/server/functions/bin';

export const Route = createFileRoute('/_authenticated/bin')({
  // Typing the URL is not a way around a hidden button.
  beforeLoad: ({ context }) => {
    if (!can(context.user, 'bin.view')) throw redirect({ to: '/dashboard' });
  },
  component: BinPage,
});

type Tab = 'loans' | 'borrowers';

type MobileHolder = { id: string; name: string } | null;

type BinnedLoan = {
  id: string;
  loanNumber: number;
  status: 'active' | 'completed' | 'defaulted' | 'extended';
  primaryAmount: string;
  totalRepayment: string;
  dateGiven: string;
  deletedAt: Date | string;
  deletedByName: string | null;
  borrowerId: string;
  borrowerName: string;
  borrowerNameTelugu: string | null;
  borrowerMobile: string;
  borrowerPhotoUrl: string | null;
  borrowerDeleted: boolean;
  borrowerMobileHolder: MobileHolder;
};

type BinnedBorrower = {
  id: string;
  name: string;
  nameTelugu: string | null;
  mobile: string;
  area: string | null;
  profilePhotoUrl: string | null;
  deletedAt: Date | string;
  deletedByName: string | null;
  liveLoanCount: number;
  totalLoanCount: number;
  mobileHolder: MobileHolder;
};

type BinRow = BinnedLoan | BinnedBorrower;

const isLoan = (row: BinRow): row is BinnedLoan => 'loanNumber' in row;

/**
 * The borrower behind a binned loan, in the shape the rules take. A binned borrower has
 * no live loans by construction, and the loan being restored is the one asking, so the
 * counts that matter here are the mobile conflict and the deleted flag.
 */
const borrowerOf = (loan: BinnedLoan): BorrowerFacts => ({
  deleted: loan.borrowerDeleted,
  liveLoanCount: 0,
  totalLoanCount: 1,
  mobileHolder: loan.borrowerMobileHolder,
});

function BinPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('loans');
  const user = useStore(authStore, (s) => s.user);
  const canPurge = can(user, 'bin.purge');

  const fetchPage = useCallback(
    (page: number, limit: number) => (tab === 'loans'
      ? listBinnedLoans({ data: { page, limit } })
      : listBinnedBorrowers({ data: { page, limit } })),
    [tab],
  );

  const cacheKey = useCallback((page: number, limit: number) => `bin:${tab}:${page}:${limit}`, [tab]);

  const list = usePaginatedList<BinRow>({
    cacheKey,
    fetchPage: fetchPage as (p: number, size: number) => Promise<PageResult<BinRow>>,
    resetKey: tab,
  });

  const { items: data, total, showSkeleton, refreshing, refresh } = list;
  const serialStart = list.isDesktop ? (list.page - 1) * list.pageSize : 0;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'loans', label: t('bin.tabLoans') },
    { key: 'borrowers', label: t('bin.tabBorrowers') },
  ];

  /** Who removed it and when — the same two facts on every row, in both layouts. */
  const removedLine = (row: BinRow) => (
    <span className="text-xs text-slate-400">
      {t('bin.removedOn')} <DateDisplay date={row.deletedAt} className="inline" />
      {row.deletedByName ? ` · ${t('bin.removedBy', { name: row.deletedByName })}` : ''}
    </span>
  );

  const actionsFor = (row: BinRow) => (isLoan(row) ? (
    <BinActions
      kind="loan"
      id={row.id}
      label={`#${row.loanNumber}`}
      restore={canRestoreLoan({ status: row.status, deleted: true }, borrowerOf(row))}
      purge={canPurgeLoan({ status: row.status, deleted: true })}
      cascadeName={row.borrowerName}
      onDone={refresh}
      canPurge={canPurge}
    />
  ) : (
    <BinActions
      kind="borrower"
      id={row.id}
      label={row.name}
      restore={canRestoreBorrower({ ...row, deleted: true })}
      purge={canPurgeBorrower({ ...row, deleted: true })}
      onDone={refresh}
      canPurge={canPurge}
    />
  ));

  return (
    <ListPage
      header={(
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
          <h2 className="whitespace-nowrap text-2xl font-bold text-slate-900 lg:shrink-0">
            {t('bin.title')}
          </h2>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1 lg:shrink-0">
            {tabs.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={clsx(
                  'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors min-h-10',
                  'lg:flex-none lg:px-4',
                  tab === item.key
                    ? 'bg-card text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
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
      ) : list.offline && data.length === 0 ? (
        <OfflineScreen onRetry={refresh} />
      ) : list.failed && data.length === 0 ? (
        <ListError message={list.errorMessage} onRetry={refresh} />
      ) : data.length === 0 ? (
        <EmptyState title={t('bin.empty')} description={t('bin.emptyHint')} />
      ) : (
        <div className="relative">
          {refreshing && (
            <div className="absolute inset-0 z-10 flex items-start justify-center rounded-2xl bg-card/70 backdrop-blur-[1px] pt-10">
              <span className="flex items-center gap-2 rounded-full bg-card px-3.5 py-2 text-sm font-medium text-slate-600 shadow-md">
                <Spinner size="sm" />{t('common.loading')}
              </span>
            </div>
          )}

          <div className={clsx('space-y-4 transition-opacity', refreshing && 'opacity-50')} aria-busy={refreshing}>
            {/* Mobile */}
            <div className="lg:hidden space-y-3 list-container">
              {data.map((row) => (
                <Card key={row.id} className="list-row">
                  <div className="flex items-start gap-3">
                    <BorrowerAvatar
                      name={isLoan(row) ? row.borrowerName : row.name}
                      nameTelugu={isLoan(row) ? row.borrowerNameTelugu : row.nameTelugu}
                      photoUrl={isLoan(row) ? row.borrowerPhotoUrl : row.profilePhotoUrl}
                      size="md"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {isLoan(row) && (
                          <span className="font-semibold text-slate-900">#{row.loanNumber}</span>
                        )}
                        <NameDisplay
                          name={isLoan(row) ? row.borrowerName : row.name}
                          nameTelugu={isLoan(row) ? row.borrowerNameTelugu : row.nameTelugu}
                          className="truncate text-sm text-slate-700"
                        />
                        {isLoan(row) && <Badge status={row.status}>{t(`loans.status.${row.status}`)}</Badge>}
                      </div>

                      {isLoan(row) ? (
                        <p className="text-sm text-slate-500">
                          <CurrencyDisplay amount={parseFloat(row.totalRepayment)} className="inline font-medium text-slate-700" />
                          {' · '}{formatPhone(row.borrowerMobile)}
                        </p>
                      ) : (
                        <div className="flex items-center gap-1">
                          <p className="text-sm text-slate-500">
                            {formatPhone(row.mobile)}{row.area ? ` · ${row.area}` : ''}
                            {row.totalLoanCount > 0 ? ` · ${t('bin.inBinCount', { count: row.totalLoanCount })}` : ''}
                          </p>
                          {/* Worth reaching someone before their record is destroyed for
                              good, which is the one thing this screen can do that no other
                              can undo. */}
                          <ContactActions mobile={row.mobile} name={row.name} variant="icons" className="-my-2" />
                        </div>
                      )}

                      {/* The cue that Restore will bring two things back. */}
                      {isLoan(row) && row.borrowerDeleted && (
                        <Badge status="deleted">{t('bin.borrowerAlsoBinned')}</Badge>
                      )}
                      {/* The conflict that stops it coming back at all. */}
                      {conflictOf(row) && (
                        <p className="text-xs font-medium text-red-600">
                          {t('bin.mobileTakenBy', { name: conflictOf(row)!.name })}
                        </p>
                      )}

                      {removedLine(row)}
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end border-t border-slate-100 pt-3">
                    {actionsFor(row)}
                  </div>
                </Card>
              ))}
            </div>

            {/* Desktop */}
            <div className="hidden lg:block overflow-x-auto overscroll-x-contain rounded-2xl border border-slate-100 bg-card">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="w-12 px-4 py-3">{t('common.serial')}</th>
                    <th className="px-4 py-3">{tab === 'loans' ? t('bin.tabLoans') : t('bin.tabBorrowers')}</th>
                    <th className="px-4 py-3">{tab === 'loans' ? t('loans.totalRepayment') : t('borrowers.mobile')}</th>
                    <th className="px-4 py-3">{t('bin.removedOn')}</th>
                    <th className="px-4 py-3 text-right">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, index) => (
                    <tr key={row.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-4 py-3 text-sm tabular-nums text-slate-400">
                        {serialStart + index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <BorrowerAvatar
                            name={isLoan(row) ? row.borrowerName : row.name}
                            nameTelugu={isLoan(row) ? row.borrowerNameTelugu : row.nameTelugu}
                            photoUrl={isLoan(row) ? row.borrowerPhotoUrl : row.profilePhotoUrl}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              {isLoan(row) && <span className="font-semibold text-slate-900">#{row.loanNumber}</span>}
                              <NameDisplay
                                name={isLoan(row) ? row.borrowerName : row.name}
                                nameTelugu={isLoan(row) ? row.borrowerNameTelugu : row.nameTelugu}
                                className="truncate text-slate-700"
                              />
                              {isLoan(row) && <Badge status={row.status}>{t(`loans.status.${row.status}`)}</Badge>}
                              {isLoan(row) && row.borrowerDeleted && (
                                <Badge status="deleted">{t('bin.borrowerAlsoBinned')}</Badge>
                              )}
                            </div>
                            {conflictOf(row) && (
                              <p className="text-xs font-medium text-red-600">
                                {t('bin.mobileTakenBy', { name: conflictOf(row)!.name })}
                              </p>
                            )}
                            {!isLoan(row) && row.area && (
                              <p className="text-xs text-slate-400">{row.area}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {isLoan(row) ? (
                          <CurrencyDisplay amount={parseFloat(row.totalRepayment)} className="font-medium text-slate-800" />
                        ) : (
                          <span>
                            {formatPhone(row.mobile)}
                            {row.totalLoanCount > 0 && (
                              <span className="ml-2 text-xs text-slate-400">
                                {t('bin.inBinCount', { count: row.totalLoanCount })}
                              </span>
                            )}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">{removedLine(row)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">{actionsFor(row)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!list.isDesktop && (list.hasMore ? (
              <InfiniteScroll onLoadMore={list.loadMore} hasMore={list.hasMore} loading={list.appending} />
            ) : (
              total > list.pageSize && <EndOfList count={data.length} />
            ))}
          </div>
        </div>
      )}
    </ListPage>
  );
}

/** The live borrower holding this row's number, whichever kind of row it is. */
function conflictOf(row: BinRow): MobileHolder {
  return isLoan(row)
    ? (row.borrowerDeleted ? row.borrowerMobileHolder : null)
    : row.mobileHolder;
}
