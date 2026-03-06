import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { listLoans } from '@/server/functions/loans';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { LoanCard } from '@/components/loans/LoanCard';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { NameDisplay } from '@/components/shared/NameDisplay';
import { EmptyState } from '@/components/shared/EmptyState';
import { Spinner } from '@/components/ui/Spinner';

export const Route = createFileRoute('/_authenticated/loans/')({
  component: LoansPage,
});

type LoanItem = {
  id: string;
  borrowerName: string;
  borrowerMobile: string;
  borrowerArea: string | null;
  primaryAmount: string;
  totalRepayment: string;
  status: 'active' | 'completed' | 'defaulted' | 'extended';
  tenureMonths: number;
  totalInstallments: number;
  dateGiven: string;
};

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

  const statusOptions = [
    { value: 'all', label: t('common.all') },
    { value: 'active', label: t('loans.statusActive') },
    { value: 'completed', label: t('loans.statusCompleted') },
    { value: 'defaulted', label: t('loans.statusDefaulted') },
    { value: 'extended', label: t('loans.statusExtended') },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">{t('loans.title')}</h2>
        <Link to="/loans/new">
          <Button size="sm">{t('loans.newLoan')}</Button>
        </Link>
      </div>

      {/* Filters */}
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
            {result.items.map((loan) => (
              <LoanCard
                key={loan.id}
                id={loan.id}
                borrowerName={loan.borrowerName}
                primaryAmount={loan.primaryAmount}
                status={loan.status}
                totalInstallments={loan.totalInstallments}
                paidInstallments={0}
                dateGiven={loan.dateGiven}
              />
            ))}
          </div>

          {/* Desktop: table view */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="pb-3 font-medium">{t('borrowers.name')}</th>
                  <th className="pb-3 font-medium">{t('loans.primaryAmount')}</th>
                  <th className="pb-3 font-medium">{t('common.status')}</th>
                  <th className="pb-3 font-medium">{t('loans.tenure')}</th>
                  <th className="pb-3 font-medium">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.items.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50">
                    <td className="py-3 font-medium text-slate-900"><NameDisplay name={loan.borrowerName} /></td>
                    <td className="py-3">
                      <CurrencyDisplay amount={parseFloat(loan.primaryAmount)} />
                    </td>
                    <td className="py-3">
                      <Badge status={loan.status}>
                        {t(`loans.status${loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}`)}
                      </Badge>
                    </td>
                    <td className="py-3 text-slate-600">{loan.tenureMonths} {t('loans.months')}</td>
                    <td className="py-3">
                      <Link
                        to="/loans/$loanId"
                        params={{ loanId: loan.id }}
                        className="text-primary hover:underline text-sm"
                      >
                        {t('loans.loanDetails')}
                      </Link>
                    </td>
                  </tr>
                ))}
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
