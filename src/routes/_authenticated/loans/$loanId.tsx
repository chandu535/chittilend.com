import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ScrollPage } from '@/components/layout/PageLayout';
import { useState, useEffect, useCallback, useRef } from 'react';
import { getLoanById, updateLoan, changeStatus } from '@/server/functions/loans';
import { binLoan } from '@/server/functions/bin';
import { canBinLoan, binReasonKey, decodeRefusal } from '@/lib/binRules';
import { invalidateListCaches } from '@/lib/requestCache';
// Messaging disabled.
// import { sendLoanWhatsAppTemplate, sendPaymentWarningWhatsApp } from '@/server/functions/whatsapp';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { Button } from '@/components/ui/Button';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { DateDisplay } from '@/components/shared/DateDisplay';
import { useLocalizedName } from '@/components/shared/NameDisplay';
import { BorrowerAvatar } from '@/components/shared/BorrowerAvatar';
import { PaymentTimeline } from '@/components/loans/PaymentTimeline';
import { PaymentMarkModal } from '@/components/loans/PaymentMarkModal';
import { AddInstallmentsModal } from '@/components/loans/AddInstallmentsModal';
// Acceptance removed.
// import { LoanAgreementCard } from '@/components/loans/LoanAgreementCard';
import { formatPhone } from '@/lib/formatters';
import { useScrollLock } from '@/lib/useScrollLock';
import { toast } from '@/components/ui/Toast';
import { clsx } from 'clsx';
import { useStore } from '@tanstack/react-store';
import { authStore } from '@/lib/stores';
import { can } from '@/lib/permissions';

export const Route = createFileRoute('/_authenticated/loans/$loanId')({
  component: LoanDetailPage,
});

type PaymentItem = {
  id: string;
  installmentNumber: number;
  dueDate: string;
  amountDue: string;
  amountPaid: string;
  paidDate: string | null;
  status: 'pending' | 'paid' | 'partial' | 'overdue' | 'waived';
  paymentMethod?: string | null;
  notes?: string | null;
};

function LoanDetailPage() {
  const { loanId } = Route.useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const user = useStore(authStore, (s) => s.user);
  const [loan, setLoan] = useState<Awaited<ReturnType<typeof getLoanById>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDefaulted, setConfirmDefaulted] = useState(false);
  const [confirmBin, setConfirmBin] = useState(false);
  const [binning, setBinning] = useState(false);
  const [confirmActive, setConfirmActive] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  // Messaging disabled.
  // const [whatsAppSending, setWhatsAppSending] = useState(false);
  // const [warningSending, setWarningSending] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const borrowerDisplayName = useLocalizedName(loan?.borrower?.name ?? '', loan?.borrower?.nameTelugu);

  const fetchLoan = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLoanById({ data: { id: loanId } });
      setLoan(data);
      setNotesValue(data.notes ?? '');
    } catch {
      // error boundary
    } finally {
      setLoading(false);
    }
  }, [loanId]);

  useEffect(() => {
    fetchLoan();
  }, [fetchLoan]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleStatusChange = async (newStatus: 'active' | 'defaulted') => {
    setStatusChanging(true);
    setConfirmDefaulted(false);
    setConfirmActive(false);
    try {
      await changeStatus({ data: { id: loanId, status: newStatus } });
      toast(t('loans.changeStatusSuccess'), 'success');
      await fetchLoan();
    } catch (err) {
      toast(err instanceof Error ? err.message : t('errors.generic'), 'error');
    } finally {
      setStatusChanging(false);
    }
  };

  const handleSaveNotes = async () => {
    setNotesSaving(true);
    try {
      await updateLoan({ data: { id: loanId, notes: notesValue } });
      toast('Notes saved', 'success');
      setEditingNotes(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : t('errors.generic'), 'error');
    } finally {
      setNotesSaving(false);
    }
  };

  if (loading) {
    return (
      <PageSkeleton variant="detail" />
    );
  }

  if (!loan) {
    // A binned loan reads as missing, so a bookmarked URL would otherwise look like the
    // loan had been lost. An admin gets told where it went; a manager cannot see the Bin
    // and so is told nothing more than that it is not here.
    return (
      <div className="py-12 text-center">
        <p className="text-slate-500">{t('errors.notFound')}</p>
        {can(user, 'bin.view') && (
          <p className="mt-2 text-sm text-slate-400">
            {t('bin.loanIsInBin')}{' '}
            <Link to="/bin" className="text-brand hover:underline">{t('bin.openBin')}</Link>
          </p>
        )}
      </div>
    );
  }

  const paidCount = loan.payments.filter((p) => p.status === 'paid').length;
  const pendingCount = loan.payments.filter((p) => p.status === 'pending' || p.status === 'partial').length;
  const overdueCount = loan.payments.filter((p) => p.status === 'overdue').length;
  const totalPaid = loan.payments
    .filter((p) => p.status === 'paid' || p.status === 'partial')
    .reduce((sum, p) => sum + parseFloat(p.amountPaid), 0);
  const outstanding = parseFloat(loan.totalRepayment) - totalPaid;
  // Capped at 100: a borrower can pay more than the amount repayable, and a 101% bar
  // overflows its track and reads as a bug rather than as an overpayment.
  const progress = parseFloat(loan.totalRepayment) > 0
    ? Math.min(100, (totalPaid / parseFloat(loan.totalRepayment)) * 100)
    : 0;
  // Messaging and acceptance removed — this gated the send buttons and the welcome.
  // const isValidIndianMobile = /^[6-9]\d{9}$/.test(loan.borrower.mobile);
  /* Messaging disabled — these only ever decided which send button to show.
  const hasOverduePayment = loan.payments.some(
    (p) => p.status === 'overdue'
      || (p.status !== 'paid' && p.status !== 'waived' && p.dueDate < new Date().toISOString().split('T')[0]),
  );
  const hasUnpaidPayment = loan.payments.some((p) => p.status !== 'paid' && p.status !== 'waived');
  */

  /* Messaging disabled — handlers kept alongside their buttons below.
  const handleWhatsAppWarning = async () => {
    if (!isValidIndianMobile) return;
    setWarningSending(true);
    try {
      await sendPaymentWarningWhatsApp({ data: { loanId } });
      toast(t('loans.whatsappWarningSent'), 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : t('errors.generic'), 'error');
    } finally {
      setWarningSending(false);
    }
  };

  const handleWhatsAppReminder = async () => {
    if (!isValidIndianMobile) return;
    setWhatsAppSending(true);
    try {
      await sendLoanWhatsAppTemplate({ data: { loanId } });
      toast(t('loans.whatsappReminderSent'), 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : t('errors.generic'), 'error');
    } finally {
      setWhatsAppSending(false);
    }
  };
  */

  const canWriteLoans = can(user, 'loans.write');
  const canBin = can(user, 'bin.write');
  const binDecision = canBinLoan({ status: loan.status, deleted: false });
  const binRefusal = binDecision.allowed
    ? undefined
    : t(binReasonKey(binDecision.reason), binDecision.detail);

  const handleBin = async () => {
    setBinning(true);
    try {
      await binLoan({ data: { id: loanId } });
      invalidateListCaches();
      toast(t('bin.loanBinned'), 'success');
      navigate({ to: '/loans' });
    } catch (err) {
      const refusal = decodeRefusal(err instanceof Error ? err.message : String(err));
      toast(refusal ? t(binReasonKey(refusal.reason), refusal.detail) : t('errors.generic'), 'error');
      setConfirmBin(false);
    } finally {
      setBinning(false);
    }
  };
  const canMarkPayments = can(user, 'payments.write');
  // Messaging disabled.
  // const canSendMessages = can(user, 'messages.send');
  const canDefault = canWriteLoans && (loan.status === 'active' || loan.status === 'extended');
  const canRevertActive = canWriteLoans && loan.status === 'defaulted';
  const canExtend = canWriteLoans && (loan.status === 'active' || loan.status === 'extended');

  return (
    <ScrollPage>
      <div className="max-w-2xl mx-auto space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center gap-2">
        <Link to="/loans" className="text-slate-400 hover:text-slate-600 shrink-0">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1 flex items-center gap-2 min-w-0 flex-wrap">
          <h2 className="text-xl font-bold text-slate-900 shrink-0">{t('loans.loanDetails')}</h2>
          <span className="text-slate-400 font-bold tabular-nums shrink-0">#{loan.loanNumber}</span>
          <Badge status={loan.status}>
            {t(`loans.status${loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}`)}
          </Badge>
        </div>

        {/* Actions menu. Hidden outright when the role can use none of it. */}
        {canWriteLoans && (
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="min-h-11 min-w-11 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Actions"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-12 z-20 w-52 bg-card rounded-xl shadow-lg border border-slate-100 py-1.5">
              <ActionMenuItem
                label={t('loans.editNotes')}
                icon="✏️"
                onClick={() => { setEditingNotes(true); setMenuOpen(false); }}
              />
              {canExtend && (
                <ActionMenuItem
                  label={t('loans.addInstallments')}
                  icon="📅"
                  onClick={() => { setShowExtendModal(true); setMenuOpen(false); }}
                />
              )}
              {canDefault && (
                <ActionMenuItem
                  label={t('loans.markDefaulted')}
                  icon="⚠️"
                  danger
                  onClick={() => { setConfirmDefaulted(true); setMenuOpen(false); }}
                />
              )}
              {canRevertActive && (
                <ActionMenuItem
                  label={t('loans.revertActive')}
                  icon="↩️"
                  onClick={() => { setConfirmActive(true); setMenuOpen(false); }}
                />
              )}
              {canBin && (
                <>
                  <div className="my-1 border-t border-slate-100" />
                  <ActionMenuItem
                    label={t('bin.moveToBin')}
                    icon="🗑️"
                    danger
                    disabled={!binDecision.allowed}
                    onClick={() => { setConfirmBin(true); setMenuOpen(false); }}
                  />
                  {/* Spelled out rather than left as a grey item. "You cannot remove a
                      loan that still owes money" is the thing the user needs to know. */}
                  {binRefusal && (
                    <p className="px-4 pb-2 text-xs leading-snug text-slate-400">{binRefusal}</p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
        )}
      </div>

      {/* ── Section 1: Borrower ── */}
      <Card>
        <Link
          to="/borrowers/$borrowerId"
          params={{ borrowerId: loan.borrower.id }}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <BorrowerAvatar
            name={loan.borrower.name}
            nameTelugu={loan.borrower.nameTelugu}
            photoUrl={loan.borrower.profilePhotoUrl}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900">{borrowerDisplayName}</p>
            <p className="text-sm text-slate-500">{formatPhone(loan.borrower.mobile)}</p>
            {loan.borrower.area && <p className="text-xs text-slate-400">{loan.borrower.area}</p>}
          </div>
          <svg className="h-4 w-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        {/* WhatsApp messaging is switched off — see the note in server/functions/payments.ts.
            The reminder and warning buttons stood here; the handlers and the senders behind
            them are intact, so restoring this is uncommenting the block.
        {isValidIndianMobile && canSendMessages && (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={handleWhatsAppReminder}
              loading={whatsAppSending}
              disabled={whatsAppSending || warningSending}
            >
              {t('loans.sendWhatsAppReminder')}
            </Button>
            {hasUnpaidPayment && (
              <Button
                variant={hasOverduePayment ? 'danger' : 'secondary'}
                size="sm"
                className="flex-1"
                onClick={handleWhatsAppWarning}
                loading={warningSending}
                disabled={whatsAppSending || warningSending}
              >
                {hasOverduePayment
                  ? t('loans.sendWhatsAppWarning')
                  : t('loans.sendWhatsAppWarningTest')}
              </Button>
            )}
          </div>
        )}
        */}
      </Card>

      {/* ── Section 2: Financial Overview ── */}
      <Card>
        <CardTitle className="mb-3">{t('loans.overviewTitle')}</CardTitle>
        <div className="grid grid-cols-2 gap-2.5">
          <OverviewTile label={t('loans.primaryAmount')}>
            <CurrencyDisplay amount={parseFloat(loan.primaryAmount)} className="font-bold text-slate-900" />
          </OverviewTile>
          <OverviewTile label={t('loans.amountReceived')}>
            <CurrencyDisplay amount={parseFloat(loan.amountUserReceived)} className="font-bold text-slate-900" />
          </OverviewTile>
          <OverviewTile label={t('loans.totalRepayment')}>
            <CurrencyDisplay amount={parseFloat(loan.totalRepayment)} className="font-bold text-slate-900" />
          </OverviewTile>
          <OverviewTile label={t('loans.profit')} accent>
            <CurrencyDisplay amount={parseFloat(loan.profitAmount)} className="font-bold text-emerald-600" />
          </OverviewTile>
        </div>
      </Card>

      {/* ── Section 3: Repayment Progress ── */}
      <Card>
        <CardTitle className="mb-3">{t('loans.repaymentProgress')}</CardTitle>
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs text-slate-500">{t('loans.totalPaid')}</p>
            <CurrencyDisplay amount={totalPaid} className="text-lg font-bold text-slate-900" />
          </div>
          <span className="text-3xl font-extrabold text-slate-900">{Math.round(progress)}%</span>
          <div className="text-right">
            <p className="text-xs text-slate-500">{t('loans.outstanding')}</p>
            <CurrencyDisplay
              amount={Math.max(0, outstanding)}
              className={clsx('text-lg font-bold', outstanding > 0 ? 'text-amber-600' : 'text-emerald-600')}
            />
          </div>
        </div>
        <div className="h-3 rounded-full bg-slate-100 overflow-hidden mb-2">
          <div
            className={clsx(
              'h-full rounded-full transition-all',
              loan.status === 'completed' ? 'bg-emerald-500'
                : loan.status === 'defaulted' ? 'bg-red-400'
                  : 'bg-primary',
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 text-center">
          {paidCount} of {loan.totalInstallments} installments ·{' '}
          <CurrencyDisplay amount={parseFloat(loan.installmentAmount)} className="inline" />
          {loan.paymentFrequency === 'monthly' ? `/${t('loans.perMonth')}` : `/${t('loans.perWeek')}`}
        </p>
      </Card>

      {/* ── Section 3b: Agreement ──
          Removed: nothing is accepted any more. This card held the owner's acceptance and
          the welcome send, and the welcome was the only thing that minted a loan's consent
          token — so with messaging off the whole flow had no way to start. The component,
          server/functions/consent.ts and the columns behind them are all left in place.
      <LoanAgreementCard
        loanId={loan.id}
        borrowerAcceptedAt={loan.borrowerAcceptedAt}
        ownerAcceptedAt={loan.ownerAcceptedAt}
        welcomeSentAt={loan.welcomeSentAt}
        canMessage={isValidIndianMobile}
        onChange={fetchLoan}
      />
      */}

      {/* ── Section 4: Loan Info ── */}
      <Card>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <InfoRow label={t('loans.dateGiven')}>
            <DateDisplay date={loan.dateGiven} className="font-medium text-slate-900" />
          </InfoRow>
          <InfoRow label={t('loans.startMonth')}>
            <DateDisplay date={loan.startMonth} className="font-medium text-slate-900" />
          </InfoRow>
          <InfoRow label={t('loans.tenure')}>
            <span className="font-medium text-slate-900">{loan.tenureMonths} {t('loans.months')}</span>
          </InfoRow>
          <InfoRow label={t('loans.frequency')}>
            <span className="font-medium text-slate-900">
              {loan.paymentFrequency === 'monthly' ? t('loans.monthly') : t('loans.weekly')}
            </span>
          </InfoRow>
          <InfoRow label={t('loans.serviceCharge')}>
            <span className="font-medium text-slate-900">{loan.serviceChargePercent}%</span>
          </InfoRow>
          <InfoRow label="Markup">
            <span className="font-medium text-slate-900">{loan.markupPercent}%</span>
          </InfoRow>
        </div>
      </Card>

      {/* ── Section 5: Payment Timeline ── */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <CardTitle>{t('payments.title')}</CardTitle>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {paidCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                {paidCount} paid
              </span>
            )}
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                {pendingCount} pending
              </span>
            )}
            {overdueCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-semibold">
                {overdueCount} overdue
              </span>
            )}
          </div>
        </div>
        <PaymentTimeline
          payments={loan.payments}
          onPaymentTap={canMarkPayments ? (payment) => setSelectedPayment(payment as PaymentItem) : undefined}
        />
      </Card>

      {/* ── Section 6: Notes ── */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <CardTitle>{t('common.notes')}</CardTitle>
          {!editingNotes && canWriteLoans && (
            <button
              type="button"
              onClick={() => setEditingNotes(true)}
              className="text-xs text-brand font-medium hover:underline"
            >
              {t('loans.editNotes')}
            </button>
          )}
        </div>

        {editingNotes ? (
          <div className="space-y-2">
            <textarea
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 bg-card px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
              placeholder={t('loans.notesPlaceholder')}
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveNotes} loading={notesSaving} disabled={notesSaving}>
                {t('loans.saveNotes')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setEditingNotes(false); setNotesValue(loan.notes ?? ''); }}
                disabled={notesSaving}
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-600 whitespace-pre-wrap min-h-[2rem]">
            {loan.notes
              ? loan.notes
              : <span className="text-slate-400 italic">{t('loans.notesPlaceholder')}</span>}
          </p>
        )}
      </Card>

      {/* ── Modals ── */}
      {selectedPayment && (
        <PaymentMarkModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onSuccess={() => { setSelectedPayment(null); fetchLoan(); }}
        />
      )}

      {showExtendModal && (
        <AddInstallmentsModal
          loan={{
            id: loan.id,
            totalInstallments: loan.totalInstallments,
            totalRepayment: loan.totalRepayment,
            paymentFrequency: loan.paymentFrequency,
            payments: loan.payments.map((p) => ({
              id: p.id,
              installmentNumber: p.installmentNumber,
              amountDue: p.amountDue,
              amountPaid: p.amountPaid,
              status: p.status,
            })),
          }}
          onClose={() => setShowExtendModal(false)}
          onSuccess={() => { setShowExtendModal(false); fetchLoan(); }}
        />
      )}

      {confirmDefaulted && (
        <ConfirmModal
          title={t('loans.markDefaulted')}
          message={t('loans.confirmDefault')}
          confirmLabel={t('loans.markDefaulted')}
          danger
          loading={statusChanging}
          onConfirm={() => handleStatusChange('defaulted')}
          onCancel={() => setConfirmDefaulted(false)}
        />
      )}

      {confirmBin && (
        <ConfirmModal
          title={t('bin.moveToBin')}
          message={t('bin.confirmBinLoan', { number: loan.loanNumber })}
          confirmLabel={t('bin.moveToBin')}
          danger
          loading={binning}
          onConfirm={handleBin}
          onCancel={() => setConfirmBin(false)}
        />
      )}

      {confirmActive && (
        <ConfirmModal
          title={t('loans.revertActive')}
          message={t('loans.confirmRevertActive')}
          confirmLabel={t('loans.revertActive')}
          loading={statusChanging}
          onConfirm={() => handleStatusChange('active')}
          onCancel={() => setConfirmActive(false)}
        />
      )}
      </div>
    </ScrollPage>
  );
}

function OverviewTile({ label, children, accent = false }: {
  label: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={clsx('rounded-xl p-3', accent ? 'bg-emerald-50' : 'bg-slate-50')}>
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function ActionMenuItem({ label, icon, danger = false, disabled = false, onClick }: {
  label: string;
  icon: string;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors',
        danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50',
        disabled && 'cursor-not-allowed opacity-40 hover:bg-transparent',
      )}
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}

function ConfirmModal({ title, message, confirmLabel, danger = false, loading, onConfirm, onCancel }: {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useScrollLock(true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-card rounded-2xl w-full max-w-sm shadow-xl p-5 space-y-4">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600">{message}</p>
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            className="flex-1"
            onClick={onConfirm}
            loading={loading}
            disabled={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
