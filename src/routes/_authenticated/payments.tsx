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
import { PaymentMarkModal } from '@/components/loans/PaymentMarkModal';
import {
  listUpcomingPayments,
  listOverduePayments,
  listRecentPayments,
  bulkUpdateOverdueStatus,
} from '@/server/functions/payments';

export const Route = createFileRoute('/_authenticated/payments')({
  component: PaymentsPage,
});

type Tab = 'upcoming' | 'overdue' | 'recent';

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

function PaymentsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [selectedPayment, setSelectedPayment] = useState<PaymentRow | null>(null);

  const fetchPage = useCallback(async (page: number, limit: number) => {
    // Overdue statuses are stale until this runs, so refresh them before the first page.
    if (tab === 'overdue' && page === 1) await bulkUpdateOverdueStatus();

    if (tab === 'upcoming') return listUpcomingPayments({ data: { days: 14, page, limit } });
    if (tab === 'overdue') return listOverduePayments({ data: { page, limit } });
    return listRecentPayments({ data: { page, limit } });
  }, [tab]);

  const cacheKey = useCallback((page: number, limit: number) => `payments:${tab}:${page}:${limit}`, [tab]);

  const list = usePaginatedList<PaymentRow>({
    cacheKey,
    fetchPage: fetchPage as (p: number, size: number) => Promise<PageResult<PaymentRow>>,
    resetKey: tab,
  });

  const { items: data, total, showSkeleton, refreshing } = list;

  // Serials continue across pages; mobile accumulates so its offset is always zero.
  const serialStart = list.isDesktop ? (list.page - 1) * list.pageSize : 0;

  const refresh = list.refresh;

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'upcoming', label: t('payments.upcoming') },
    { key: 'overdue', label: t('payments.overdue') },
    { key: 'recent', label: t('payments.recent') },
  ];

  const isActionable = tab !== 'recent';

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
                  ? 'bg-white text-slate-900 shadow-sm'
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
          title={tab === 'overdue' ? t('payments.noOverdue') : t('payments.noUpcoming')}
        />
      ) : (
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
          {/* Mobile: Card view */}
          <div className="lg:hidden space-y-3 list-container">
            {data.map((p) => (
              <Card key={p.id} className="list-row">
                <div className="flex items-center justify-between mb-2">
                  <Link
                    to="/loans/$loanId"
                    params={{ loanId: p.loanId }}
                    className="font-medium text-slate-900 hover:text-primary"
                  >
                    <NameDisplay name={p.borrowerName} nameTelugu={p.borrowerNameTelugu} />
                  </Link>
                  <Badge status={p.status}>{t(`payments.${p.status}`)}</Badge>
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
                {data.map((p, index) => (
                  <tr
                    key={p.id}
                    className={`hover:bg-slate-50 ${p.status === 'overdue' ? 'bg-red-50/50' : ''}`}
                  >
                    <td className="py-3 text-sm text-slate-400 tabular-nums">{serialStart + index + 1}</td>
                    <td className="py-3">
                      <Link
                        to="/loans/$loanId"
                        params={{ loanId: p.loanId }}
                        className="font-medium text-slate-900 hover:text-primary"
                      >
                        <NameDisplay name={p.borrowerName} nameTelugu={p.borrowerNameTelugu} />
                      </Link>
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
