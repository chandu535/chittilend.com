import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@tanstack/react-store';
import { authStore } from '@/lib/stores';
import { Spinner } from '@/components/ui/Spinner';
import { TimeFilter } from '@/components/analytics/TimeFilter';
import { AreaBreakdown } from '@/components/analytics/AreaBreakdown';
import { BorrowerStats } from '@/components/analytics/BorrowerStats';
import { StatusPieChart } from '@/components/analytics/StatusPieChart';
import { MonthlySnapshot } from '@/components/analytics/MonthlySnapshot';
import { CollectionChart } from '@/components/dashboard/CollectionChart';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import {
  getCashflowTimeline,
  getAreaBreakdown,
  getBorrowerRanking,
  getStatusDistribution,
  getMonthlySnapshot,
  getDashboardSummary,
} from '@/server/functions/analytics';

export const Route = createFileRoute('/_authenticated/analytics')({
  component: AnalyticsPage,
});

type CashflowItem = { month: string; collections: number; disbursements: number; investments: number };
type AreaItem = { area: string; loanCount: number; borrowerCount: number; totalLent: number; defaults: number };
type BorrowerItem = { id: string; name: string; mobile: string; area: string; totalPayments: number; onTime: number; onTimePercent: number; totalBorrowed: number };
type StatusItem = { status: string; count: number };
type SnapshotItem = { month: number; year: number; loansGivenCount: number; loansGivenAmount: number; collected: number; newBorrowers: number };

function AnalyticsPage() {
  const { t } = useTranslation();
  const user = useStore(authStore, (s) => s.user);
  const isAdmin = user?.role === 'admin';

  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const defaultTo = now.toISOString().split('T')[0];

  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);
  const [loading, setLoading] = useState(true);

  const [cashflow, setCashflow] = useState<CashflowItem[]>([]);
  const [areas, setAreas] = useState<AreaItem[]>([]);
  const [borrowers, setBorrowers] = useState<BorrowerItem[]>([]);
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [currentMonth, setCurrentMonth] = useState<SnapshotItem | null>(null);
  const [prevMonth, setPrevMonth] = useState<SnapshotItem | null>(null);
  const [summary, setSummary] = useState<{ totalDeployed: number; profitEarned: number; toCollect: number } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const prevMonthNum = now.getMonth() === 0 ? 12 : now.getMonth();
      const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

      const results = await Promise.all([
        getCashflowTimeline({ data: { dateFrom, dateTo } }),
        getAreaBreakdown({ data: { dateFrom, dateTo } }),
        getBorrowerRanking(),
        getStatusDistribution(),
        getMonthlySnapshot({ data: { month: now.getMonth() + 1, year: now.getFullYear() } }),
        getMonthlySnapshot({ data: { month: prevMonthNum, year: prevYear } }),
        getDashboardSummary(),
      ]);

      setCashflow(results[0] as CashflowItem[]);
      setAreas(results[1] as AreaItem[]);
      setBorrowers(results[2] as BorrowerItem[]);
      setStatuses(results[3] as StatusItem[]);
      setCurrentMonth(results[4] as SnapshotItem);
      setPrevMonth(results[5] as SnapshotItem);
      setSummary(results[6] as { totalDeployed: number; profitEarned: number; toCollect: number });
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRangeChange = (from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold text-slate-900">{t('analytics.title')}</h2>

      {/* Time Filter */}
      <TimeFilter onRangeChange={handleRangeChange} />

      {/* Summary Row */}
      {summary && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm text-center">
            <CurrencyDisplay amount={summary.totalDeployed} className="text-lg font-bold text-slate-900" />
            <p className="text-xs text-slate-500 mt-1">{t('dashboard.totalDeployed')}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm text-center">
            <CurrencyDisplay amount={summary.toCollect} className="text-lg font-bold text-amber-600" />
            <p className="text-xs text-slate-500 mt-1">{t('analytics.amountPending')}</p>
          </div>
          {isAdmin && (
            <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm text-center">
              <CurrencyDisplay amount={summary.profitEarned} className="text-lg font-bold text-emerald-600" />
              <p className="text-xs text-slate-500 mt-1">{t('analytics.profitRealized')}</p>
            </div>
          )}
          {!isAdmin && (
            <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm text-center">
              <p className="text-lg font-bold text-slate-900">{statuses.reduce((s, d) => s + d.count, 0)}</p>
              <p className="text-xs text-slate-500 mt-1">{t('analytics.totalLoans')}</p>
            </div>
          )}
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Cashflow Chart */}
        <div className="sm:col-span-2">
          <CollectionChart data={cashflow} />
        </div>

        {/* Status Pie Chart */}
        <StatusPieChart data={statuses} />

        {/* Area Breakdown */}
        <AreaBreakdown data={areas} />
      </div>

      {/* Monthly Comparison */}
      <MonthlySnapshot current={currentMonth} previous={prevMonth} />

      {/* Borrower Reliability */}
      <BorrowerStats data={borrowers} />
    </div>
  );
}
