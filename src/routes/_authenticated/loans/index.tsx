import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { listLoans } from '@/server/functions/loans';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { LoanCard } from '@/components/loans/LoanCard';
import { BorrowerAvatar } from '@/components/shared/BorrowerAvatar';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { NameDisplay } from '@/components/shared/NameDisplay';
import { EmptyState } from '@/components/shared/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { clsx } from 'clsx';

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
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<{
    items: LoanItem[];
    total: number;
    totalPages: number;
  }>({ items: [], total: 0, totalPages: 0 });

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const data = await listLoans({ data: { page, limit, status, search } });
      setResult(data as unknown as typeof result);
    } catch {
      // error boundary
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [page, status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchLoans();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Summary stats computed from current page items
  const activeCount = result.items.filter((l) => l.status === 'active' || l.status === 'extended').length;
  const overdueCount = result.items.filter((l) => l.nextPayment?.status === 'overdue').length;
  const dueTodayCount = result.items.filter(
    (l) => l.nextPayment && isToday(l.nextPayment.dueDate) && l.nextPayment.status !== 'overdue',
  ).length;

  const statusOptions = [
    { value: 'all', label: t('common.all') },
    { value: 'active', label: t('loans.statusActive') },
    { value: 'completed', label: t('loans.statusCompleted') },
    { value: 'defaulted', label: t('loans.statusDefaulted') },
    { value: 'extended', label: t('loans.statusExtended') },
  ];
  const sortedLoans = [...result.items].sort((a, b) => {
    const priorityDifference = loanDisplayPriority(a) - loanDisplayPriority(b);
    return priorityDifference || a.loanNumber - b.loanNumber;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[22px] font-semibold text-slate-900 tracking-tight">{t('loans.title')}</h2>
        <Link to="/loans/new">
          <Button size="sm">{t('loans.newLoan')}</Button>
        </Link>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <Input
            placeholder={t('common.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>
        <Select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          options={statusOptions}
        />
      </div>

      {/* Summary strip */}
      {!loading && result.items.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <SummaryPill
            label={`${activeCount} Active`}
            color="blue"
            onClick={() => { setStatus('active'); setPage(1); }}
            active={status === 'active'}
          />
          {overdueCount > 0 && (
            <SummaryPill label={`${overdueCount} Overdue`} color="red" />
          )}
          {dueTodayCount > 0 && (
            <SummaryPill label={`${dueTodayCount} Due Today`} color="amber" />
          )}
          <SummaryPill
            label={`${result.total} Total`}
            color="slate"
            onClick={() => { setStatus('all'); setPage(1); }}
            active={status === 'all'}
          />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : result.items.length === 0 ? (
        <EmptyState
          title={t('loans.noLoans')}
          action={
            <Link to="/loans/new">
              <Button>{t('loans.newLoan')}</Button>
            </Link>
          }
        />
      ) : (
        <>
          {/* Mobile: card view */}
          <div className="sm:hidden space-y-3">
            {sortedLoans.map((loan) => (
              <LoanCard
                key={loan.id}
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
            ))}
          </div>

          {/* Desktop: table view */}
          <div className="hidden sm:block overflow-x-auto rounded-2xl border border-slate-100 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3 font-semibold w-12">#</th>
                  <th className="px-4 py-3 font-semibold">{t('borrowers.name')}</th>
                  <th className="px-4 py-3 font-semibold">{t('loans.primaryAmount')}</th>
                  <th className="px-4 py-3 font-semibold">{t('common.status')}</th>
                  <th className="px-4 py-3 font-semibold">Progress</th>
                  <th className="px-4 py-3 font-semibold">Next Payment</th>
                  <th className="px-4 py-3 font-semibold">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sortedLoans.map((loan) => {
                  const progress = parseFloat(loan.totalRepayment) > 0
                    ? Math.round((parseFloat(loan.paidAmount) / parseFloat(loan.totalRepayment)) * 100)
                    : 0;
                  const nextOverdue = loan.nextPayment?.status === 'overdue';
                  const nextPartial = loan.nextPayment?.status === 'partial';

                  return (
                    <tr key={loan.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-lg text-slate-500 font-bold tabular-nums">#{loan.loanNumber}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <BorrowerAvatar name={loan.borrowerName} photoUrl={loan.borrowerPhotoUrl} size="sm" />
                          <div>
                            <NameDisplay name={loan.borrowerName} className="font-medium text-slate-900" />
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

          {/* Pagination */}
          {result.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                {t('common.back')}
              </Button>
              <span className="text-sm text-slate-500">
                {page} / {result.totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.min(result.totalPages, p + 1))}
                disabled={page === result.totalPages}
              >
                {t('common.next')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SummaryPill({
  label,
  color,
  onClick,
  active,
}: {
  label: string;
  color: 'blue' | 'red' | 'amber' | 'slate';
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={clsx(
        'shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors',
        color === 'blue' && (active
          ? 'bg-primary text-white border-primary'
          : 'bg-primary/10 text-primary border-primary/20'),
        color === 'red' && 'bg-red-50 text-red-600 border-red-200',
        color === 'amber' && 'bg-amber-50 text-amber-700 border-amber-200',
        color === 'slate' && (active
          ? 'bg-slate-700 text-white border-slate-700'
          : 'bg-slate-100 text-slate-600 border-slate-200'),
        onClick ? 'cursor-pointer hover:opacity-80' : 'cursor-default',
      )}
    >
      {label}
    </button>
  );
}
