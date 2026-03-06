import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { PortalHeader } from '@/components/portal/PortalHeader';
import { PortalLoanCard } from '@/components/portal/PortalLoanCard';
import { PortalPaymentList } from '@/components/portal/PortalPaymentList';
import { getPortalData } from '@/server/functions/portal';
import { useLocalizedName } from '@/components/shared/NameDisplay';

export const Route = createFileRoute('/portal/$token')({
  component: PortalPage,
});

type PortalData = Awaited<ReturnType<typeof getPortalData>>;

function PortalPage() {
  const { token } = Route.useParams();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PortalData | null>(null);
  const borrowerName = useLocalizedName(data?.borrower?.name || '');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const result = await getPortalData({ data: { token } });
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('errors.invalidToken'));
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [token, t]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PortalHeader />
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PortalHeader />
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <div className="text-4xl mb-4">{'!'}</div>
          <p className="text-lg font-semibold text-slate-700">
            {error || t('errors.invalidToken')}
          </p>
        </div>
      </div>
    );
  }

  const allCompleted = data.loans.every(
    (l) => l.status === 'completed',
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <PortalHeader />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Welcome */}
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-900">
            {t('portal.welcome', { name: borrowerName })}
          </p>
        </div>

        {allCompleted && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
            <p className="text-emerald-700 font-medium">{t('portal.allPaid')}</p>
          </div>
        )}

        {/* Loans */}
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          {t('portal.yourLoans')}
        </h3>

        {data.loans.map((loan) => (
          <div key={loan.id} className="space-y-3">
            <PortalLoanCard
              primaryAmount={loan.primaryAmount}
              totalRepayment={loan.totalRepayment}
              installmentAmount={loan.installmentAmount}
              totalInstallments={loan.totalInstallments}
              paidCount={loan.paidCount}
              totalRemaining={loan.totalRemaining}
              paymentFrequency={loan.paymentFrequency}
              status={loan.status}
              nextDue={loan.nextDue}
            />

            {/* Payment Schedule */}
            <div className="px-1">
              <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">
                {t('portal.paymentSchedule')}
              </h4>
              <PortalPaymentList payments={loan.payments} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
