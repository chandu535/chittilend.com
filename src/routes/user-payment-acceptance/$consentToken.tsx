import { createFileRoute, redirect } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { PortalHeader } from '@/components/portal/PortalHeader';
import { Button } from '@/components/ui/Button';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { DateDisplay } from '@/components/shared/DateDisplay';
import { useLocalizedName } from '@/components/shared/NameDisplay';
import { toast } from '@/components/ui/Toast';
import { getLoanForConsent, acceptLoanAsBorrower } from '@/server/functions/consent';

/**
 * Acceptance has been removed — nothing is accepted any more.
 *
 * Consent links were already sent to some borrowers and stay valid in the database, so the
 * route cannot simply be deleted: those URLs would land on a 404. It sends them to the
 * home page instead, and the acceptance itself is refused server-side in
 * server/functions/consent.ts so an old link cannot record anything.
 *
 * The page below is intact. Restoring the flow is swapping the component back.
 */
export const Route = createFileRoute('/user-payment-acceptance/$consentToken')({
  // beforeLoad runs first and never returns, so the component below is left wired up but
  // never rendered. Restoring the flow is deleting these three lines.
  beforeLoad: () => {
    throw redirect({ to: '/' });
  },
  component: LoanAcceptancePage,
});

type ConsentLoan = Awaited<ReturnType<typeof getLoanForConsent>>;

function LoanAcceptancePage() {
  const { consentToken } = Route.useParams();
  const { t } = useTranslation();
  const [loan, setLoan] = useState<ConsentLoan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const borrowerName = useLocalizedName(loan?.borrowerName ?? '', loan?.borrowerNameTelugu);

  const load = useCallback(async () => {
    try {
      setLoan(await getLoanForConsent({ data: { token: consentToken } }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.invalidToken'));
    } finally {
      setLoading(false);
    }
  }, [consentToken, t]);

  useEffect(() => { load(); }, [load]);

  const handleAccept = async () => {
    setSubmitting(true);
    try {
      await acceptLoanAsBorrower({ data: { token: consentToken } });
      toast(t('portal.consentThanks'), 'success');
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : t('errors.generic'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Shell>
        <PageSkeleton variant="portal" />
      </Shell>
    );
  }

  if (error || !loan) {
    return (
      <Shell>
        <div className="py-12 text-center">
          <div className="text-4xl mb-4">!</div>
          <p className="text-lg font-semibold text-slate-700">{error || t('errors.invalidToken')}</p>
        </div>
      </Shell>
    );
  }

  if (loan.borrowerAcceptedAt) {
    return (
      <Shell>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <div className="text-4xl mb-3">✓</div>
          <p className="font-semibold text-emerald-800">{t('portal.consentRecorded')}</p>
          <p className="mt-1 text-sm text-emerald-700">
            <DateDisplay date={loan.borrowerAcceptedAt as unknown as string} />
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-900">
            {t('portal.welcome', { name: borrowerName })}
          </p>
          <p className="mt-1 text-sm text-slate-500">{t('portal.consentIntro')}</p>
        </div>

        <div className="rounded-2xl border-2 border-primary/30 bg-white p-4 space-y-3">
          <h2 className="font-semibold text-slate-900">{t('portal.consentTitle')}</h2>

          <dl className="rounded-lg bg-slate-50 p-3 space-y-1.5 text-sm">
            <Row label={t('loans.loanNumber')}>#{loan.loanNumber}</Row>
            <Row label={t('loans.primaryAmount')}>
              <CurrencyDisplay amount={parseFloat(loan.primaryAmount)} className="font-semibold text-slate-900" />
            </Row>
            <Row label={t('loans.amountReceived')}>
              <CurrencyDisplay amount={parseFloat(loan.amountUserReceived)} className="font-semibold text-slate-900" />
            </Row>
            <Row label={t('loans.totalRepayment')}>
              <CurrencyDisplay amount={parseFloat(loan.totalRepayment)} className="font-semibold text-slate-900" />
            </Row>
            <Row label={t('loans.installmentAmount')}>
              <span className="font-semibold text-slate-900">
                <CurrencyDisplay amount={parseFloat(loan.installmentAmount)} className="inline" />
                {' × '}
                {loan.totalInstallments}
              </span>
            </Row>
          </dl>

          <p className="text-xs text-slate-500">{t('portal.consentDeclaration')}</p>

          <Button className="w-full" onClick={handleAccept} loading={submitting} disabled={submitting}>
            {t('portal.consentAccept')}
          </Button>

          <p className="text-center text-xs text-slate-400">{t('portal.consentQuestions')}</p>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-slate-50">
      <PortalHeader />
      <div className="max-w-lg mx-auto px-4 py-6">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}
