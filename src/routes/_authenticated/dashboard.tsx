import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ScrollPage } from '@/components/layout/PageLayout';
import { useState, useEffect } from 'react';
import { useStore } from '@tanstack/react-store';
import { authStore } from '@/lib/stores';
import { useLocalizedName } from '@/components/shared/NameDisplay';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { cachedRequest } from '@/lib/requestCache';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { OverdueAlerts } from '@/components/dashboard/OverdueAlerts';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { CollectionChart } from '@/components/dashboard/CollectionChart';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { getDashboardSummary, getCashflowTimeline, getRecentActivity } from '@/server/functions/analytics';
import { bulkUpdateOverdueStatus } from '@/server/functions/payments';

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
});

function getGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'greeting.morning';
  if (hour < 17) return 'greeting.afternoon';
  return 'greeting.evening';
}

type Summary = Awaited<ReturnType<typeof getDashboardSummary>>;
type CashflowItem = { month: string; collections: number; disbursements: number; investments: number };
type ActivityItem = {
  id: string;
  eventDate: Date | string;
  eventType: 'investment' | 'collection' | 'disbursement';
  amount: number;
  loanId: string | null;
  borrowerName: string | null;
  borrowerNameTelugu: string | null;
};

function DashboardPage() {
  const { t } = useTranslation();
  const user = useStore(authStore, (s) => s.user);
  const userName = useLocalizedName(user?.name || '');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [cashflow, setCashflow] = useState<CashflowItem[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        // Refresh overdue statuses on dashboard load
        await bulkUpdateOverdueStatus();

        const [summaryData, cashflowData, activityData] = await cachedRequest(
          'dashboard:overview',
          () => Promise.all([getDashboardSummary(), getCashflowTimeline({ data: {} }), getRecentActivity()]),
          30_000,
        );
        setSummary(summaryData);
        setCashflow(cashflowData as CashflowItem[]);
        setActivity(activityData as ActivityItem[]);
      } catch {
        // error
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <PageSkeleton variant="dashboard" />
    );
  }

  return (
    <ScrollPage>
      <div className="max-w-2xl mx-auto space-y-4">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          {t(getGreetingKey())}{user ? `, ${userName}` : ''}
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">{t('dashboard.subtitle')}</p>
      </div>

      {/* Overdue Alert */}
      {summary && <OverdueAlerts count={summary.overduePayments} />}

      {/* Summary Cards */}
      {summary && (
        <SummaryCards
          data={{
            totalDeployed: summary.totalDeployed,
            availableCapital: summary.availableCapital,
            toCollect: summary.toCollect,
            profitEarned: summary.profitEarned,
          }}
        />
      )}

      {/* Quick Actions */}
      <QuickActions />

      {/* This Month Stats */}
      {summary && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">{t('dashboard.thisMonthCollected')}</p>
            <p className="text-lg font-bold text-emerald-600 mt-1">
              <span className="inline">
                {summary.thisMonthCollected > 0 ? '+' : ''}
              </span>
              <span>
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(summary.thisMonthCollected)}
              </span>
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">{t('dashboard.thisMonthGiven')}</p>
            <p className="text-lg font-bold text-red-600 mt-1">
              <span>
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(summary.thisMonthDisbursed)}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Collection Chart */}
      <CollectionChart data={cashflow} />

      {/* Recent Activity */}
      <RecentActivity items={activity} />

      {/* Active Loans count */}
      {summary && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm text-center">
            <p className="text-3xl font-bold text-primary">{summary.activeLoans}</p>
            <p className="text-xs text-slate-500 mt-1">{t('dashboard.activeLoans')}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm text-center">
            <p className="text-3xl font-bold text-red-600">{summary.overduePayments}</p>
            <p className="text-xs text-slate-500 mt-1">{t('dashboard.overduePayments')}</p>
          </div>
        </div>
      )}
      </div>
    </ScrollPage>
  );
}
