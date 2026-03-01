import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { getBorrowerById } from '@/server/functions/borrowers';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { MagicLinkGenerator } from '@/components/borrowers/MagicLinkGenerator';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { formatPhone } from '@/lib/formatters';

export const Route = createFileRoute('/_authenticated/borrowers/$borrowerId')({
  component: BorrowerDetailPage,
});

function BorrowerDetailPage() {
  const { borrowerId } = Route.useParams();
  const { t } = useTranslation();
  const [borrower, setBorrower] = useState<Awaited<ReturnType<typeof getBorrowerById>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await getBorrowerById({ data: { id: borrowerId } });
        setBorrower(data);
      } catch {
        // error boundary
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [borrowerId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!borrower) {
    return <p className="text-center text-slate-500 py-12">{t('errors.notFound')}</p>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Link to="/borrowers" className="text-slate-400 hover:text-slate-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h2 className="text-2xl font-bold text-slate-900">{borrower.name}</h2>
      </div>

      {/* Profile Card */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-semibold shrink-0">
            {borrower.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-lg font-semibold text-slate-900">{borrower.name}</p>
            <p className="text-sm text-slate-600">{formatPhone(borrower.mobile)}</p>
            {borrower.area && (
              <p className="text-sm text-slate-500">{borrower.area}</p>
            )}
            {borrower.address && (
              <p className="text-sm text-slate-400">{borrower.address}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Loans */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <CardTitle>{t('loans.title')}</CardTitle>
          <Link to="/loans/new">
            <Button size="sm">{t('loans.newLoan')}</Button>
          </Link>
        </div>

        {borrower.loans.length === 0 ? (
          <p className="text-sm text-slate-400">{t('loans.noLoans')}</p>
        ) : (
          <div className="space-y-2">
            {borrower.loans.map((loan) => (
              <Link
                key={loan.id}
                to="/loans/$loanId"
                params={{ loanId: loan.id }}
                className="flex items-center justify-between rounded-lg border border-slate-100 p-3 hover:bg-slate-50 transition-colors"
              >
                <div>
                  <CurrencyDisplay
                    amount={parseFloat(loan.primaryAmount)}
                    className="font-semibold text-slate-900"
                  />
                  <p className="text-xs text-slate-400">{loan.dateGiven}</p>
                </div>
                <Badge status={loan.status}>{loan.status}</Badge>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Magic Link */}
      <Card>
        <MagicLinkGenerator
          borrowerId={borrower.id}
          portalToken={borrower.portalToken}
        />
      </Card>
    </div>
  );
}
