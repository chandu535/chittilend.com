import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DateDisplay } from '@/components/shared/DateDisplay';
import { toast } from '@/components/ui/Toast';
import { acceptLoanAsOwner } from '@/server/functions/consent';
import { sendLoanWelcomeWhatsApp } from '@/server/functions/whatsapp';

interface LoanAgreementCardProps {
  loanId: string;
  borrowerAcceptedAt: Date | string | null;
  ownerAcceptedAt: Date | string | null;
  welcomeSentAt: Date | string | null;
  canMessage: boolean;
  onChange: () => void;
}

export function LoanAgreementCard({
  loanId,
  borrowerAcceptedAt,
  ownerAcceptedAt,
  welcomeSentAt,
  canMessage,
  onChange,
}: LoanAgreementCardProps) {
  const { t } = useTranslation();
  const [accepting, setAccepting] = useState(false);
  const [sending, setSending] = useState(false);

  const handleOwnerAccept = async () => {
    setAccepting(true);
    try {
      await acceptLoanAsOwner({ data: { loanId } });
      toast(t('loans.agreementOwnerRecorded'), 'success');
      onChange();
    } catch (err) {
      toast(err instanceof Error ? err.message : t('errors.generic'), 'error');
    } finally {
      setAccepting(false);
    }
  };

  const handleSendWelcome = async () => {
    setSending(true);
    try {
      await sendLoanWelcomeWhatsApp({ data: { loanId } });
      toast(t('loans.welcomeSent'), 'success');
      onChange();
    } catch (err) {
      toast(err instanceof Error ? err.message : t('errors.generic'), 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardTitle className="mb-3">{t('loans.agreementTitle')}</CardTitle>

      <div className="space-y-2">
        <PartyRow
          label={t('loans.agreementBorrower')}
          acceptedAt={borrowerAcceptedAt}
          pendingLabel={welcomeSentAt ? t('loans.agreementAwaiting') : t('loans.agreementNotSent')}
        />
        <PartyRow
          label={t('loans.agreementOwner')}
          acceptedAt={ownerAcceptedAt}
          pendingLabel={t('loans.agreementPending')}
        />
      </div>

      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        {!ownerAcceptedAt && (
          <Button
            className="flex-1"
            onClick={handleOwnerAccept}
            loading={accepting}
            disabled={accepting}
          >
            {t('loans.agreementAcceptAsOwner')}
          </Button>
        )}
        {canMessage && !borrowerAcceptedAt && (
          <Button
            variant="secondary"
            className="flex-1"
            onClick={handleSendWelcome}
            loading={sending}
            disabled={sending}
          >
            {welcomeSentAt ? t('loans.welcomeResend') : t('loans.welcomeSend')}
          </Button>
        )}
      </div>

      {welcomeSentAt && !borrowerAcceptedAt && (
        <p className="mt-2 text-xs text-slate-400">
          {t('loans.welcomeSentOn')} <DateDisplay date={welcomeSentAt as string} className="inline" />
        </p>
      )}
    </Card>
  );
}

function PartyRow({
  label,
  acceptedAt,
  pendingLabel,
}: {
  label: string;
  acceptedAt: Date | string | null;
  pendingLabel: string;
}) {
  const accepted = Boolean(acceptedAt);

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="flex items-center gap-2 text-right">
        <span
          className={clsx(
            'h-2 w-2 rounded-full shrink-0',
            accepted ? 'bg-emerald-500' : 'bg-slate-300',
          )}
        />
        <span className={clsx('text-xs font-medium', accepted ? 'text-emerald-700' : 'text-slate-400')}>
          {accepted ? <DateDisplay date={acceptedAt as string} /> : pendingLabel}
        </span>
      </span>
    </div>
  );
}
