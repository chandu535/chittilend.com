import { useState, useCallback, useEffect, memo } from 'react';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { InlineSkeleton } from '@/components/ui/PageSkeleton';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { DateDisplay } from '@/components/shared/DateDisplay';
import { useLocalizedName } from '@/components/shared/NameDisplay';
import { BorrowerAvatar } from '@/components/shared/BorrowerAvatar';
import { ContactActions } from '@/components/shared/ContactActions';
import { PaymentTimeline } from './PaymentTimeline';
import { PaymentMarkModal } from './PaymentMarkModal';
import { getLoanById } from '@/server/functions/loans';
import { useStore } from '@tanstack/react-store';
import { authStore } from '@/lib/stores';
import { can } from '@/lib/permissions';

type LoanDetail = Awaited<ReturnType<typeof getLoanById>>;
type PaymentItem = LoanDetail['payments'][0];

type NextPayment = {
  id: string;
  installmentNumber: number;
  dueDate: string;
  amountDue: string;
  amountPaid: string;
  status: 'pending' | 'partial' | 'overdue';
};

interface LoanCardProps {
  id: string;
  loanNumber: number;
  borrowerName: string;
  borrowerNameTelugu?: string | null;
  borrowerPhotoUrl?: string | null;
  borrowerMobile?: string | null;
  nextPayment?: NextPayment | null;
  primaryAmount: string;
  totalRepayment: string;
  paidAmount: string;
  status: 'active' | 'completed' | 'defaulted' | 'extended';
  totalInstallments: number;
  paidInstallments: number;
  dateGiven: string;
}

function isOverdueDate(dueDate: string): boolean {
  const due = new Date(dueDate + 'T00:00:00');
  const today = new Date();
  const endOfCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return due <= endOfCurrentMonth;
}

function overdueDays(dueDate: string): number {
  const due = new Date(dueDate + 'T00:00:00');
  const today = new Date();
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  today.setHours(0, 0, 0, 0);
  const overdueFrom = due < currentMonthStart ? due : currentMonthStart;
  return Math.max(0, Math.floor((today.getTime() - overdueFrom.getTime()) / 86400000));
}

function getChipLabel(nextPayment: NextPayment, chipRemaining: number | null): string {
  if (nextPayment.status === 'overdue' || isOverdueDate(nextPayment.dueDate)) {
    return `${overdueDays(nextPayment.dueDate)}d overdue`;
  }
  if (chipRemaining !== null && chipRemaining > 0) {
    return `₹${Math.round(chipRemaining).toLocaleString('en-IN')}`;
  }
  const due = new Date(nextPayment.dueDate + 'T00:00:00');
  return due.toLocaleDateString('en-IN', { month: 'short' });
}

const STATUS_STRIP: Record<string, string> = {
  active: 'from-violet-500 to-violet-400',
  completed: 'from-emerald-500 to-teal-400',
  defaulted: 'from-red-500 to-rose-400',
  extended: 'from-amber-500 to-yellow-400',
};

const STATUS_LABEL: Record<string, { bg: string; text: string; label: string }> = {
  active:    { bg: 'bg-violet-50',  text: 'text-violet-700',  label: 'Active' },
  completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Completed' },
  defaulted: { bg: 'bg-red-50',     text: 'text-red-600',     label: 'Defaulted' },
  extended:  { bg: 'bg-amber-50',   text: 'text-amber-700',   label: 'Extended' },
};

function LoanCardImpl({
  id,
  loanNumber,
  borrowerName,
  borrowerNameTelugu,
  borrowerPhotoUrl, borrowerMobile,
  nextPayment: nextPaymentProp,
  primaryAmount,
  totalRepayment,
  paidAmount: paidAmountProp,
  status,
  totalInstallments,
  paidInstallments,
  dateGiven,
}: LoanCardProps) {
  const { t } = useTranslation();
  const displayName = useLocalizedName(borrowerName, borrowerNameTelugu);
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState<LoanDetail | null>(null);
  const [fetching, setFetching] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);
  const user = useStore(authStore, (s) => s.user);
  const canMarkPayments = can(user, 'payments.write');
  const [nextPayment, setNextPayment] = useState<NextPayment | null>(nextPaymentProp ?? null);

  useEffect(() => { setNextPayment(nextPaymentProp ?? null); }, [nextPaymentProp]);

  useEffect(() => {
    if (!details) return;
    const next = details.payments.find((p) => p.status !== 'paid' && p.status !== 'waived');
    setNextPayment(
      next ? {
        id: next.id,
        installmentNumber: next.installmentNumber,
        dueDate: next.dueDate as string,
        amountDue: next.amountDue as string,
        amountPaid: next.amountPaid as string,
        status: next.status as NextPayment['status'],
      } : null,
    );
  }, [details]);

  const paidCount = details?.payments.filter((p) => p.status === 'paid').length ?? paidInstallments;
  const pendingCount = details?.payments.filter((p) => p.status === 'pending' || p.status === 'partial').length ?? 0;
  const overdueCount = details?.payments.filter((p) => p.status === 'overdue').length ?? 0;
  const paidAmount = details
    ? details.payments.reduce((sum, payment) => sum + parseFloat(payment.amountPaid), 0)
    : parseFloat(paidAmountProp);
  const repaymentAmount = details ? parseFloat(details.totalRepayment) : parseFloat(totalRepayment);
  // Capped for the same reason as the detail screen — see the note there.
  const progress = repaymentAmount > 0 ? Math.min(100, (paidAmount / repaymentAmount) * 100) : 0;

  const loadDetails = useCallback(async () => {
    setFetching(true);
    try {
      const data = await getLoanById({ data: { id } });
      setDetails(data);
    } catch {
      // silent
    } finally {
      setFetching(false);
    }
  }, [id]);

  const handleToggle = useCallback(() => {
    const willOpen = !open;
    // Expand first so the skeleton is visible while details load. Awaiting the fetch
    // before opening makes the card look unresponsive for the length of the request.
    setOpen(willOpen);
    if (willOpen && !details) void loadDetails();
  }, [open, details, loadDetails]);

  const handleQuickMark = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!nextPayment) return;
    setSelectedPayment({
      id: nextPayment.id,
      installmentNumber: nextPayment.installmentNumber,
      dueDate: nextPayment.dueDate,
      amountDue: nextPayment.amountDue,
      amountPaid: nextPayment.amountPaid,
      paidDate: null,
      status: nextPayment.status,
      loanId: id,
      createdAt: '',
      updatedAt: '',
      paymentMethod: null,
      notes: null,
      recordedBy: null,
    } as unknown as PaymentItem);
  }, [nextPayment, id]);

  const chipOverdue = nextPayment && (nextPayment.status === 'overdue' || isOverdueDate(nextPayment.dueDate));
  const chipPartial = nextPayment?.status === 'partial';
  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0, 0, 0, 0);
  const hasPreviousMonthBalance = Boolean(
    nextPayment && new Date(nextPayment.dueDate + 'T00:00:00') < currentMonthStart,
  );
  const chipRemainingCalc = chipPartial && nextPayment
    ? parseFloat(nextPayment.amountDue) - parseFloat(nextPayment.amountPaid)
    : null;
  const chipRemaining = chipRemainingCalc && chipRemainingCalc > 0 ? chipRemainingCalc : null;
  const paidForCurrentMonth = Boolean(
    nextPayment
      && !chipOverdue
      && new Date(nextPayment.dueDate + 'T00:00:00') > new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() + 1, 0),
  );

  const pill = STATUS_LABEL[status];

  return (
    <>
      <div
        className={clsx(
          'bg-white rounded-3xl overflow-hidden border transition-all duration-300',
          status === 'completed' ? 'border-emerald-300' : 'border-slate-200',
          open
            ? 'shadow-[0_8px_32px_rgba(109,40,217,0.15)]'
            : 'shadow-[0_2px_16px_rgba(109,40,217,0.08)] hover:shadow-[0_4px_24px_rgba(109,40,217,0.13)]',
        )}
      >
        {/* Thin status gradient strip at top */}
        <div className={clsx('h-[3px] bg-gradient-to-r', STATUS_STRIP[status])} />

        {/* ── Collapsed header ── */}
        {/* A div rather than a button: the header contains its own buttons (quick-pay,
            avatar preview) and nesting interactive elements is invalid HTML. */}
        <div
          role="button"
          tabIndex={0}
          aria-expanded={open}
          onClick={handleToggle}
          onKeyDown={(e) => {
            if (e.target !== e.currentTarget) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleToggle();
            }
          }}
          className="w-full text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset"
        >
          <div className="flex items-center gap-3.5 px-4 pt-4 pb-3">
            {/* Avatar */}
            <div className="shrink-0">
              <BorrowerAvatar name={borrowerName} nameTelugu={borrowerNameTelugu} photoUrl={borrowerPhotoUrl} size="lg" />
            </div>

            {/* Name + amount */}
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-slate-500 tabular-nums mb-0.5">
                #{loanNumber}
              </p>
              <p className="font-semibold text-slate-800 text-[15px] leading-snug truncate">{displayName}</p>
              <CurrencyDisplay
                amount={parseFloat(primaryAmount)}
                className="text-[22px] font-bold text-slate-900 leading-tight"
              />
            </div>

            {/* Right column */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              {/* Status pill */}
              <span className={clsx('px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide', pill.bg, pill.text)}>
                {pill.label}
              </span>

              {/* Quick-pay chip. Only offered to a role that may actually mark a payment. */}
              {status === 'completed' ? null : paidForCurrentMonth ? (
                <div className="h-10 w-10 flex items-center justify-center rounded-2xl border border-slate-200 bg-white">
                  <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : nextPayment && canMarkPayments ? (
                <button
                  type="button"
                  onClick={handleQuickMark}
                  className={clsx(
                    'flex flex-col items-center rounded-2xl px-2.5 py-1.5 min-w-[50px]',
                    'font-semibold text-[11px] leading-none',
                    'transition-transform duration-150 active:scale-95',
                    chipPartial && !hasPreviousMonthBalance
                      ? 'border border-red-200 bg-red-100 text-red-700'
                      : chipOverdue
                        ? 'bg-gradient-to-b from-red-500 to-red-600 text-white shadow-[0_2px_8px_rgba(239,68,68,0.4)]'
                        : 'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-[0_2px_8px_rgba(16,185,129,0.35)]',
                  )}
                  aria-label={`Mark installment ${nextPayment.installmentNumber} paid`}
                >
                  <span className="text-center leading-tight">{getChipLabel(nextPayment, chipRemaining)}</span>
                  {!chipOverdue && (
                    <svg className="h-3 w-3 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ) : null}

              {/* Chevron */}
              <svg
                className={clsx('h-4 w-4 text-slate-300 transition-transform duration-200', open && 'rotate-180')}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Progress bar + meta */}
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-slate-400 font-medium">{paidCount} of {totalInstallments} payments</span>
              <span className="font-semibold text-slate-500">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={clsx(
                  'h-full rounded-full transition-all duration-500',
                  status === 'completed' ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : status === 'defaulted' ? 'bg-gradient-to-r from-red-400 to-rose-400'
                      : 'bg-gradient-to-r from-violet-500 to-violet-400',
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
            {/* The pay chip above already shouts "483d overdue"; repeating it here said
                the same thing twice and crowded out the one fact the collapsed card was
                missing — when the next instalment is actually due. */}
            <div className="flex justify-between gap-2 text-[11px] mt-1.5">
              <DateDisplay date={dateGiven} className="shrink-0 text-slate-400" />
              {nextPayment && (
                <span className={clsx('truncate', chipOverdue ? 'font-semibold text-red-500' : 'text-slate-400')}>
                  {t('loans.nextPayment')} <DateDisplay date={nextPayment.dueDate} />
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Outside the header above, which toggles the card: a tap on Call must dial,
            not expand. Collections happen on the phone, so this is one tap from the list
            rather than a number to read off the screen and type into the dialler. */}
        {borrowerMobile && (
          <ContactActions mobile={borrowerMobile} name={displayName} className="px-4 pb-3" />
        )}

        {/* ── Expanded content ── */}
        {open && (
          <div className="border-t border-slate-50">
            {fetching ? (
              /* Mirrors the loaded layout below — same padding, same six-tile grid,
                 same pill and link rows — so nothing shifts when the data lands. */
              <div className="px-4 pb-5 pt-4 space-y-4" aria-busy="true">
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: 6 }, (_, i) => (
                    <InlineSkeleton key={i} className="h-[52px] rounded-2xl" />
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <InlineSkeleton className="h-[26px] w-20 rounded-full" />
                  <InlineSkeleton className="h-[26px] w-24 rounded-full" />
                </div>

                <div className="flex items-center justify-between">
                  <InlineSkeleton className="h-4 w-24" />
                  <InlineSkeleton className="h-4 w-28" />
                </div>

                <div>
                  <InlineSkeleton className="h-3 w-20 mb-3" />
                  <div className="space-y-0">
                    {Array.from({ length: 3 }, (_, i) => (
                      <div key={i} className="flex gap-3">
                        <InlineSkeleton className="h-8 w-8 rounded-full shrink-0" />
                        <InlineSkeleton className="flex-1 h-[62px] mb-2" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : details ? (
              <div className="px-4 pb-5 pt-4 space-y-4">
                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-2">
                  <MiniStat label={t('loans.amountGiven')}>
                    <CurrencyDisplay amount={parseFloat(details.amountUserReceived)} className="font-semibold text-slate-800 text-[13px]" />
                  </MiniStat>
                  <MiniStat label={t('loans.totalRepayment')}>
                    <CurrencyDisplay amount={parseFloat(details.totalRepayment)} className="font-semibold text-slate-800 text-[13px]" />
                  </MiniStat>
                  <MiniStat label={t('loans.installment')}>
                    <div className="flex items-baseline gap-1">
                      <CurrencyDisplay amount={parseFloat(details.installmentAmount)} className="font-semibold text-slate-800 text-[13px]" />
                      <span className="text-[10px] text-slate-400">
                        /{details.paymentFrequency === 'monthly' ? 'mo' : 'wk'}
                      </span>
                    </div>
                  </MiniStat>
                  <MiniStat label={t('loans.profit')} accent>
                    <CurrencyDisplay amount={parseFloat(details.profitAmount)} className="font-semibold text-emerald-600 text-[13px]" />
                  </MiniStat>
                  <MiniStat label={t('loans.dateGiven')}>
                    <DateDisplay date={details.dateGiven} className="font-medium text-slate-800 text-[13px]" />
                  </MiniStat>
                  <MiniStat label={t('loans.tenure')}>
                    <span className="font-medium text-slate-800 text-[13px]">{details.tenureMonths} {t('loans.months')}</span>
                  </MiniStat>
                </div>

                {/* Payment status pills */}
                {details.payments.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {paidCount > 0 && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                        {paidCount} paid
                      </span>
                    )}
                    {pendingCount > 0 && (
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[11px] font-semibold">
                        {pendingCount} pending
                      </span>
                    )}
                    {overdueCount > 0 && (
                      <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-500 text-[11px] font-semibold">
                        {overdueCount} overdue
                      </span>
                    )}
                  </div>
                )}

                {/* Quick links */}
                <div className="flex items-center justify-between">
                  <Link
                    to="/borrowers/$borrowerId"
                    params={{ borrowerId: details.borrower.id }}
                    className="flex items-center gap-1.5 text-[12px] font-semibold text-violet-600"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {t('borrowers.title')}
                  </Link>
                  <Link
                    to="/loans/$loanId"
                    params={{ loanId: id }}
                    className="flex items-center gap-1 text-[12px] font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {t('loans.loanDetails')}
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>

                {/* Payment timeline */}
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
                    {t('payments.title')}
                  </p>
                  <PaymentTimeline
                    payments={details.payments}
                    onPaymentTap={canMarkPayments ? (p) => setSelectedPayment(p as PaymentItem) : undefined}
                  />
                </div>
              </div>
            ) : (
              <div className="flex justify-center py-6">
                <button onClick={loadDetails} className="text-sm text-violet-600 font-medium">Retry</button>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedPayment && (
        <PaymentMarkModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onSuccess={async () => {
            setSelectedPayment(null);
            await loadDetails();
          }}
        />
      )}
    </>
  );
}

/**
 * Memoised: infinite scroll appends pages, so without this every previously rendered
 * card re-renders on each append. All props are primitives except nextPayment, which is
 * compared field-by-field below.
 */
export const LoanCard = memo(LoanCardImpl, (prev, next) => (
  prev.id === next.id
  && prev.status === next.status
  && prev.paidAmount === next.paidAmount
  && prev.paidInstallments === next.paidInstallments
  && prev.borrowerName === next.borrowerName
  && prev.borrowerNameTelugu === next.borrowerNameTelugu
  && prev.borrowerPhotoUrl === next.borrowerPhotoUrl
  && prev.borrowerMobile === next.borrowerMobile
  && prev.nextPayment?.id === next.nextPayment?.id
  && prev.nextPayment?.status === next.nextPayment?.status
  && prev.nextPayment?.amountPaid === next.nextPayment?.amountPaid
  && prev.nextPayment?.dueDate === next.nextPayment?.dueDate
));

function MiniStat({
  label,
  children,
  accent = false,
}: {
  label: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={clsx(
      'rounded-2xl px-3 py-2.5',
      accent ? 'bg-emerald-50' : 'bg-[#F7F6FE]',
    )}>
      <p className="text-[10px] font-medium text-slate-400 mb-0.5 uppercase tracking-wide">{label}</p>
      <div>{children}</div>
    </div>
  );
}
