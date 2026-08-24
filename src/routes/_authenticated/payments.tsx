import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { OfflineScreen } from '@/components/shared/OfflineScreen';
import { Spinner } from '@/components/ui/Spinner';
import { Pagination } from '@/components/ui/Pagination';
import { InfiniteScroll, EndOfList } from '@/components/ui/InfiniteScroll';
import { usePaginatedList, type PageResult } from '@/lib/usePaginatedList';
import { clsx } from 'clsx';
import { ListPage } from '@/components/layout/PageLayout';
import { ListError } from '@/components/shared/ListError';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { DateDisplay } from '@/components/shared/DateDisplay';
import { NameDisplay } from '@/components/shared/NameDisplay';
import { BorrowerAvatar } from '@/components/shared/BorrowerAvatar';
import { ContactActions } from '@/components/shared/ContactActions';
import { formatPhone } from '@/lib/formatters';
import { PaymentMarkModal } from '@/components/loans/PaymentMarkModal';
import { useStore } from '@tanstack/react-store';
import { can } from '@/lib/permissions';
import { authStore } from '@/lib/stores';
import {
  listOverduePayments,
  listRecentPayments,
  bulkUpdateOverdueStatus,
} from '@/server/functions/payments';
import { listGivenLoans } from '@/server/functions/loans';

export const Route = createFileRoute('/_authenticated/payments')({
  component: PaymentsPage,
});

/**
 * Recent leads because it answers the question this screen is opened with — what came in.
 * Overdue is who to chase. Given is the other side of the ledger entirely: money that went
 * out, kept for good rather than in a rolling window.
 *
 * There was an Upcoming tab. It forecast instalments not yet due, which the day book made
 * redundant — collections are recorded at the door as they happen, so a list of what has
 * not happened yet was a screen nobody acted on.
 */
type Tab = 'recent' | 'overdue' | 'given';

type PaymentRow = {
  id: string;
  loanId: string;
  installmentNumber: number;
  dueDate: string;
  amountDue: string;
  amountPaid: string;
  paidDate: string | null;
  status: 'pending' | 'paid' | 'partial' | 'overdue' | 'waived';
  borrowerName: string;
  borrowerNameTelugu: string | null;
  borrowerMobile: string;
  loanPrimaryAmount: string;
};

/** A disbursement. Different shape from a payment, so the two never share a row renderer. */
type GivenRow = {
  id: string;
  loanNumber: number;
  dateGiven: string;
  amountGiven: string;
  primaryAmount: string;
  status: string;
  borrowerName: string;
  borrowerNameTelugu: string | null;
  borrowerMobile: string;
  borrowerPhotoUrl: string | null;
};

function PaymentsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('recent');
  const [selectedPayment, setSelectedPayment] = useState<PaymentRow | null>(null);

  const fetchPage = useCallback(async (page: number, limit: number) => {
    // Overdue statuses are stale until this runs, so refresh them before the first page.
    if (tab === 'overdue' && page === 1) await bulkUpdateOverdueStatus();

    if (tab === 'given') return listGivenLoans({ data: { page, limit } });
    if (tab === 'overdue') return listOverduePayments({ data: { page, limit } });
    return listRecentPayments({ data: { page, limit } });
  }, [tab]);

  const cacheKey = useCallback((page: number, limit: number) => `payments:${tab}:${page}:${limit}`, [tab]);

  // One list, two row shapes. `tab` is what says which, and switching it resets the
  // accumulated items, so a Given row can never be read as a payment or the other way round.
  const list = usePaginatedList<PaymentRow | GivenRow>({
    cacheKey,
    fetchPage: fetchPage as (p: number, size: number) => Promise<PageResult<PaymentRow | GivenRow>>,
    resetKey: tab,
  });

  const { items: data, total, showSkeleton, refreshing } = list;

  // Serials continue across pages; mobile accumulates so its offset is always zero.
  const serialStart = list.isDesktop ? (list.page - 1) * list.pageSize : 0;

  const refresh = list.refresh;

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'recent', label: t('payments.recent') },
    { key: 'overdue', label: t('payments.overdue') },
    { key: 'given', label: t('payments.given') },
  ];

  // Recent payments are history, and a manager may not mark anything, so neither gets
  // an action column.
  const user = useStore(authStore, (s) => s.user);
  // Only the overdue list is actionable: recent is history, and Given is a record of money
  // already handed over.
  const isActionable = tab === 'overdue' && can(user, 'payments.write');

  return (
    <ListPage
      header={<>
      {/* Title and tabs share one row on desktop; the tab strip only takes the width
          its labels need rather than stretching across the page. */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <h2 className="whitespace-nowrap text-2xl font-bold text-slate-900 lg:shrink-0">{t('payments.title')}</h2>

        <div className="flex gap-1 rounded-lg bg-slate-100 p-1 lg:shrink-0">
          {tabs.map((tabItem) => (
            <button
              key={tabItem.key}
              type="button"
              onClick={() => setTab(tabItem.key)}
              className={clsx(
                'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors min-h-10',
                'lg:flex-none lg:px-4',
                tab === tabItem.key
                  ? 'bg-card text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700',
              )}
            >
              {tabItem.label}
            </button>
          ))}
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
        <PageSkeleton variant="list" />
      ) : list.offline && data.length === 0 ? (
        <OfflineScreen onRetry={refresh} />
      ) : list.failed && data.length === 0 ? (
        <ListError message={list.errorMessage} onRetry={refresh} />
      ) : data.length === 0 ? (
        <EmptyState
          title={tab === 'overdue' ? t('payments.noOverdue')
            : tab === 'given' ? t('payments.noGiven')
              : t('payments.noRecent')}
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
          {tab === 'given' ? (
            <GivenList rows={data as GivenRow[]} serialStart={serialStart} />
          ) : (
          <>
          {/* Mobile: Card view */}
          <div className="lg:hidden space-y-3 list-container">
            {(data as PaymentRow[]).map((p) => (
              <Card key={p.id} className="list-row">
                <div className="flex items-center justify-between mb-2">
                  <Link
                    to="/loans/$loanId"
                    params={{ loanId: p.loanId }}
                    className="font-medium text-slate-900 hover:text-brand"
                  >
                    <NameDisplay name={p.borrowerName} nameTelugu={p.borrowerNameTelugu} />
                  </Link>
                  <div className="flex items-center gap-1">
                    <ContactActions mobile={p.borrowerMobile} name={p.borrowerName} variant="icons" />
                    <Badge status={p.status}>{t(`payments.${p.status}`)}</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">
                    {t('payments.installmentNo', { number: p.installmentNumber })}
                  </span>
                  <CurrencyDisplay amount={parseFloat(p.amountDue)} className="font-semibold" />
                </div>
                <div className="flex items-center justify-between mt-1 text-sm">
                  <DateDisplay
                    date={tab === 'recent' && p.paidDate ? p.paidDate : p.dueDate}
                    className="text-slate-500"
                  />
                  {isActionable && (
                    <Button size="sm" onClick={() => setSelectedPayment(p)}>
                      {t('payments.markPaid')}
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop: Table view */}
          <div className="hidden lg:block overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="pb-3 font-medium whitespace-nowrap w-12">{t('common.serial')}</th>
                  <th className="pb-3 font-medium whitespace-nowrap">{t('borrowers.name')}</th>
                  <th className="pb-3 font-medium whitespace-nowrap">{t('payments.installmentNo', { number: '' }).replace('#', '#')}</th>
                  <th className="pb-3 font-medium whitespace-nowrap">
                    {tab === 'recent' ? t('payments.paidDate') : t('payments.dueDate')}
                  </th>
                  <th className="pb-3 font-medium whitespace-nowrap">{t('payments.amountDue')}</th>
                  <th className="pb-3 font-medium whitespace-nowrap">{t('common.status')}</th>
                  {isActionable && <th className="pb-3 font-medium whitespace-nowrap">{t('common.actions')}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data as PaymentRow[]).map((p, index) => (
                  <tr
                    key={p.id}
                    className={`hover:bg-slate-50 ${p.status === 'overdue' ? 'bg-red-50/50' : ''}`}
                  >
                    <td className="py-3 text-sm text-slate-400 tabular-nums">{serialStart + index + 1}</td>
                    <td className="py-3">
                      <Link
                        to="/loans/$loanId"
                        params={{ loanId: p.loanId }}
                        className="font-medium text-slate-900 hover:text-brand"
                      >
                        <NameDisplay name={p.borrowerName} nameTelugu={p.borrowerNameTelugu} />
                      </Link>
                      <ContactActions
                        mobile={p.borrowerMobile}
                        name={p.borrowerName}
                        variant="icons"
                        className="-my-2 ml-1 inline-flex align-middle"
                      />
                    </td>
                    <td className="py-3 text-slate-600">
                      #{p.installmentNumber}
                    </td>
                    <td className="py-3">
                      <DateDisplay
                        date={tab === 'recent' && p.paidDate ? p.paidDate : p.dueDate}
                        className="text-slate-600"
                      />
                    </td>
                    <td className="py-3">
                      <CurrencyDisplay amount={parseFloat(p.amountDue)} className="font-medium" />
                    </td>
                    <td className="py-3">
                      <Badge status={p.status}>{t(`payments.${p.status}`)}</Badge>
                    </td>
                    {isActionable && (
                      <td className="py-3">
                        <Button size="sm" onClick={() => setSelectedPayment(p)}>
                          {t('payments.markPaid')}
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
          )}

          {!list.isDesktop && (list.hasMore ? (
            <InfiniteScroll onLoadMore={list.loadMore} hasMore={list.hasMore} loading={list.appending} />
          ) : (
            total > list.pageSize && <EndOfList count={data.length} />
          ))}
          </div>
        </div>
      )}

      {/* Payment Mark Modal */}
      {selectedPayment && (
        <PaymentMarkModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onSuccess={() => {
            setSelectedPayment(null);
            refresh();
          }}
        />
      )}
    </ListPage>
  );
}

/**
 * Money that went out, one line per loan.
 *
 * Only what the request asked for: who, their number, how much, and when. No status, no
 * instalments, no progress — the loans list already answers all of that, and this is a
 * record of a disbursement rather than a view of a debt.
 *
 * Every loan is here, however old. That is the point of the tab: the recent-payments list
 * is a thirty-day window, and a disbursement does not stop being a fact after thirty days.
 */
function GivenList({ rows, serialStart }: { rows: GivenRow[]; serialStart: number }) {
  const { t } = useTranslation();

  return (
    <>
      {/* Mobile: card view */}
      <div className="lg:hidden space-y-3 list-container">
        {rows.map((g) => (
          <Card key={g.id} className="list-row">
            <div className="flex items-start gap-3">
              <BorrowerAvatar
                name={g.borrowerName}
                nameTelugu={g.borrowerNameTelugu}
                photoUrl={g.borrowerPhotoUrl}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="shrink-0 text-[13px] font-bold tabular text-brand">#{g.loanNumber}</span>
                  <Link
                    to="/loans/$loanId"
                    params={{ loanId: g.id }}
                    className="min-w-0 font-medium text-slate-900 hover:text-brand"
                  >
                    <NameDisplay
                      name={g.borrowerName}
                      nameTelugu={g.borrowerNameTelugu}
                      className="block truncate"
                    />
                  </Link>
                </div>
                <div className="flex items-center gap-1">
                  <p className="truncate text-sm text-slate-400">{formatPhone(g.borrowerMobile)}</p>
                  <ContactActions
                    mobile={g.borrowerMobile}
                    name={g.borrowerName}
                    variant="icons"
                    className="-my-2"
                  />
                </div>
              </div>
              <div className="shrink-0 text-right">
                {/* Red, because this is the app's colour for money leaving — the same
                    reading the day book gives a "gave" row. */}
                <CurrencyDisplay amount={parseFloat(g.amountGiven)} className="font-semibold text-red-600" />
                <DateDisplay date={g.dateGiven} className="block text-xs text-slate-400" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Desktop: table view */}
      <div className="hidden lg:block overflow-x-auto overscroll-x-contain">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="pb-3 font-medium whitespace-nowrap w-12">{t('common.serial')}</th>
              <th className="pb-3 font-medium whitespace-nowrap w-20">{t('loans.loanNo')}</th>
              <th className="pb-3 font-medium whitespace-nowrap">{t('borrowers.name')}</th>
              <th className="pb-3 font-medium whitespace-nowrap">{t('borrowers.mobile')}</th>
              <th className="pb-3 font-medium whitespace-nowrap">{t('loans.amountGiven')}</th>
              <th className="pb-3 font-medium whitespace-nowrap">{t('loans.dateGiven')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((g, index) => (
              <tr key={g.id} className="hover:bg-slate-50">
                <td className="py-3 text-sm text-slate-400 tabular-nums">{serialStart + index + 1}</td>
                <td className="py-3 font-bold tabular text-brand">#{g.loanNumber}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2.5">
                    <BorrowerAvatar
                      name={g.borrowerName}
                      nameTelugu={g.borrowerNameTelugu}
                      photoUrl={g.borrowerPhotoUrl}
                      size="sm"
                    />
                    <Link
                      to="/loans/$loanId"
                      params={{ loanId: g.id }}
                      className="font-medium text-slate-900 hover:text-brand"
                    >
                      <NameDisplay name={g.borrowerName} nameTelugu={g.borrowerNameTelugu} />
                    </Link>
                  </div>
                </td>
                <td className="py-3 text-slate-600">
                  <div className="flex items-center gap-1">
                    <span className="tabular">{formatPhone(g.borrowerMobile)}</span>
                    <ContactActions mobile={g.borrowerMobile} name={g.borrowerName} variant="icons" />
                  </div>
                </td>
                <td className="py-3">
                  <CurrencyDisplay amount={parseFloat(g.amountGiven)} className="font-semibold text-red-600" />
                </td>
                <td className="py-3">
                  <DateDisplay date={g.dateGiven} className="text-slate-600" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
