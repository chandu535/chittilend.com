import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ScrollPage } from '@/components/layout/PageLayout';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '@tanstack/react-store';
import { authStore } from '@/lib/stores';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { cachedRequest } from '@/lib/requestCache';
import { TimeFilter } from '@/components/analytics/TimeFilter';
import { AreaBreakdown } from '@/components/analytics/AreaBreakdown';
import { BorrowerStats } from '@/components/analytics/BorrowerStats';
import { StatusPieChart } from '@/components/analytics/StatusPieChart';
import { MonthlySnapshot } from '@/components/analytics/MonthlySnapshot';
import { CollectionChart } from '@/components/dashboard/CollectionChart';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { BusyOverlay } from '@/components/shared/BusyOverlay';
import {
  getCashflowTimeline,
  getAreaBreakdown,
  getBorrowerRanking,
  getStatusDistribution,
  getMonthlySnapshot,
  getDashboardSummary,
  getRangeSummary,
} from '@/server/functions/analytics';

export const Route = createFileRoute('/_authenticated/analytics')({
  component: AnalyticsPage,
});

type CashflowItem = { month: string; collections: number; disbursements: number; investments: number };
type AreaItem = { area: string; loanCount: number; borrowerCount: number; totalLent: number; defaults: number };
type BorrowerItem = { id: string; name: string; nameTelugu: string | null; mobile: string; area: string; totalPayments: number; onTime: number; onTimePercent: number; totalBorrowed: number };
type StatusItem = { status: string; count: number };
type RangeSummary = { disbursed: number; loansGiven: number; collected: number; paymentsReceived: number; profitRealized: number; newBorrowers: number };
type SnapshotItem = { month: number; year: number; loansGivenCount: number; loansGivenAmount: number; collected: number; newBorrowers: number };

function AnalyticsPage() {
  const { t } = useTranslation();
  const user = useStore(authStore, (s) => s.user);
  const isAdmin = user?.role === 'admin';

  const now = new Date();
  // Local calendar parts, not toISOString — that converts to UTC and would shift the
  // first of the month back a day in any positive offset such as IST.
  const isoDate = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  // Matches TimeFilter's default: the whole current month.
  const defaultFrom = isoDate(new Date(now.getFullYear(), now.getMonth(), 1));
  const defaultTo = isoDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));

  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);

  // Two independent loads. Only the cashflow timeline and the area breakdown are
  // filtered by the date range; the other five queries take no range at all, so a
  // filter change must not refetch them or blank the cards that show them.
  const [rangeSummary, setRangeSummary] = useState<RangeSummary | null>(null);
  const [rangeLoading, setRangeLoading] = useState(true);
  const [staticLoading, setStaticLoading] = useState(true);

  const [cashflow, setCashflow] = useState<CashflowItem[]>([]);
  const [areas, setAreas] = useState<AreaItem[]>([]);
  const [borrowers, setBorrowers] = useState<BorrowerItem[]>([]);
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [currentMonth, setCurrentMonth] = useState<SnapshotItem | null>(null);
  const [prevMonth, setPrevMonth] = useState<SnapshotItem | null>(null);
  const [summary, setSummary] = useState<{ totalDeployed: number; profitEarned: number; toCollect: number } | null>(null);

  // Guards against a slow earlier range overwriting a newer one.
  const rangeRequestId = useRef(0);

  const fetchRangeData = useCallback(async () => {
    const id = ++rangeRequestId.current;
    setRangeLoading(true);
    try {
      const [timeline, breakdown, periodSummary] = await cachedRequest(
        `analytics:range:${dateFrom}:${dateTo}`,
        () => Promise.all([
          getCashflowTimeline({ data: { dateFrom, dateTo } }),
          getAreaBreakdown({ data: { dateFrom, dateTo } }),
          getRangeSummary({ data: { dateFrom, dateTo } }),
        ]),
        60_000,
      );
      if (id !== rangeRequestId.current) return;
      setCashflow(timeline as CashflowItem[]);
      setAreas(breakdown as AreaItem[]);
      setRangeSummary(periodSummary as RangeSummary);
    } catch {
      // error boundary
    } finally {
      if (id === rangeRequestId.current) setRangeLoading(false);
    }
  }, [dateFrom, dateTo]);

  const fetchStaticData = useCallback(async () => {
    setStaticLoading(true);
    try {
      const prevMonthNum = now.getMonth() === 0 ? 12 : now.getMonth();
      const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

      const results = await cachedRequest('analytics:static', () => Promise.all([
        getBorrowerRanking(),
        getStatusDistribution(),
        getMonthlySnapshot({ data: { month: now.getMonth() + 1, year: now.getFullYear() } }),
        getMonthlySnapshot({ data: { month: prevMonthNum, year: prevYear } }),
        getDashboardSummary(),
      ]), 60_000);

      setBorrowers(results[0] as BorrowerItem[]);
      setStatuses(results[1] as StatusItem[]);
      setCurrentMonth(results[2] as SnapshotItem);
      setPrevMonth(results[3] as SnapshotItem);
      setSummary(results[4] as { totalDeployed: number; profitEarned: number; toCollect: number });
    } catch {
      // error boundary
    } finally {
      setStaticLoading(false);
    }
    // `now` is created fresh each render but only its month/year are read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchRangeData(); }, [fetchRangeData]);
  useEffect(() => { fetchStaticData(); }, [fetchStaticData]);

  const handleRangeChange = (from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
  };

  // The whole-page skeleton is for the very first load only. After that the page frame
  // and the time filter stay mounted, and each region reports its own busy state.
  const firstLoad = (rangeLoading || staticLoading) && !summary && !rangeSummary;
  if (firstLoad) {
    return <PageSkeleton variant="dashboard" />;
  }

  return (
    <ScrollPage>
      <div className="max-w-4xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold text-slate-900">{t('analytics.title')}</h2>

      {/* Time Filter */}
      <TimeFilter onRangeChange={handleRangeChange} />

      {/* Money that moved inside the selected period. These are flows, so they change
          with the filter. */}
      <BusyOverlay busy={rangeLoading}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <StatTile
            label={t('analytics.givenInPeriod')}
            value={rangeSummary?.disbursed ?? 0}
            sub={t('analytics.loansCount', { count: rangeSummary?.loansGiven ?? 0 })}
          />
          <StatTile
            label={t('analytics.collectedInPeriod')}
            value={rangeSummary?.collected ?? 0}
            sub={t('analytics.paymentsCount', { count: rangeSummary?.paymentsReceived ?? 0 })}
            tone="text-slate-900"
          />
          {isAdmin && (
            <StatTile
              label={t('analytics.profitInPeriod')}
              value={rangeSummary?.profitRealized ?? 0}
              sub={t('analytics.newBorrowersCount', { count: rangeSummary?.newBorrowers ?? 0 })}
              tone="text-emerald-600"
            />
          )}
        </div>
      </BusyOverlay>

      {/* Balances as they stand right now. Deliberately outside the period cards and
          labelled as such — an outstanding balance describes a moment, not a window, so
          scoping it to "this week" would be meaningless. */}
      {summary && (
        <div className="rounded-xl border border-slate-100 bg-card p-3 shadow-sm">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            {t('analytics.asOfToday')}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <CurrencyDisplay amount={summary.totalDeployed} className="text-lg font-bold text-slate-900" />
              <p className="mt-0.5 text-xs text-slate-500">{t('dashboard.totalDeployed')}</p>
            </div>
            <div>
              <CurrencyDisplay amount={summary.toCollect} className="text-lg font-bold text-amber-600" />
              <p className="mt-0.5 text-xs text-slate-500">{t('analytics.amountPending')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Cashflow Chart */}
        <div className="sm:col-span-2">
          <BusyOverlay busy={rangeLoading}>
            <CollectionChart data={cashflow} />
          </BusyOverlay>
        </div>

        {/* Status Pie Chart */}
        <StatusPieChart data={statuses} />

        {/* Area Breakdown */}
        <BusyOverlay busy={rangeLoading}>
          <AreaBreakdown data={areas} />
        </BusyOverlay>
      </div>

      {/* Monthly Comparison */}
      <MonthlySnapshot current={currentMonth} previous={prevMonth} />

      {/* Borrower Reliability */}
      <BorrowerStats data={borrowers} />
      </div>
    </ScrollPage>
  );
}

function StatTile({
  label,
  value,
  sub,
  tone = 'text-slate-900',
}: {
  label: string;
  value: number;
  sub?: string;
  tone?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-card p-3 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <CurrencyDisplay amount={value} className={`mt-0.5 block text-lg font-bold ${tone}`} />
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}
