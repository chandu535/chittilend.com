import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';
import { getLoanById } from '@/server/functions/loans';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { DateDisplay } from '@/components/shared/DateDisplay';
import { useLocalizedName } from '@/components/shared/NameDisplay';
import { PaymentTimeline } from '@/components/loans/PaymentTimeline';
import { PaymentMarkModal } from '@/components/loans/PaymentMarkModal';
import { formatPhone } from '@/lib/formatters';

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
};

function LoanDetailPage() {
  const { loanId } = Route.useParams();
  const { t } = useTranslation();
  const [loan, setLoan] = useState<Awaited<ReturnType<typeof getLoanById>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);
  const borrowerDisplayName = useLocalizedName(loan?.borrower?.name ?? '');

  const fetchLoan = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLoanById({ data: { id: loanId } });
      setLoan(data);
    } catch {
      // error boundary
    } finally {
      setLoading(false);
    }
  }, [loanId]);

  useEffect(() => {
    fetchLoan();
  }, [fetchLoan]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!loan) {
    return <p className="text-center text-slate-500 py-12">{t('errors.notFound')}</p>;
  }
  const paidCount = loan.payments.filter((p) => p.status === 'paid').length;
  const progress = loan.totalInstallments > 0 ? (paidCount / loan.totalInstallments) * 100 : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Link to="/loans" className="text-slate-400 hover:text-slate-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h2 className="text-2xl font-bold text-slate-900">{t('loans.loanDetails')}</h2>
      </div>

      {/* Borrower Info */}
      <Card>
        <Link
          to="/borrowers/$borrowerId"
          params={{ borrowerId: loan.borrower.id }}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
            {borrowerDisplayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-slate-900">{borrowerDisplayName}</p>
            <p className="text-sm text-slate-500">{formatPhone(loan.borrower.mobile)}</p>
          </div>
        </Link>
      </Card>

      {/* Loan Summary */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <CardTitle>{t('loans.loanDetails')}</CardTitle>
          <Badge status={loan.status}>
            {t(`loans.status${loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}`)}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-slate-500">{t('loans.primaryAmount')}</p>
            <CurrencyDisplay amount={parseFloat(loan.primaryAmount)} className="font-semibold text-slate-900" />
          </div>
          <div>
            <p className="text-slate-500">{t('loans.amountReceived')}</p>
            <CurrencyDisplay amount={parseFloat(loan.amountUserReceived)} className="font-semibold text-slate-900" />
          </div>
          <div>
            <p className="text-slate-500">{t('loans.totalRepayment')}</p>
            <CurrencyDisplay amount={parseFloat(loan.totalRepayment)} className="font-bold text-slate-900" />
          </div>
          <div>
            <p className="text-slate-500">{t('loans.installment')}</p>
            <CurrencyDisplay amount={parseFloat(loan.installmentAmount)} className="font-semibold text-slate-900" />
            <span className="text-xs text-slate-400 ml-1">
              {loan.paymentFrequency === 'monthly' ? t('loans.perMonth') : t('loans.perWeek')}
            </span>
          </div>
          <div>
            <p className="text-slate-500">{t('loans.dateGiven')}</p>
            <DateDisplay date={loan.dateGiven} className="font-medium text-slate-900" />
          </div>
          <div>
            <p className="text-slate-500">{t('loans.profit')}</p>
            <CurrencyDisplay amount={parseFloat(loan.profitAmount)} className="font-semibold text-emerald-600" />
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>{t('loans.progress', { paid: paidCount, total: loan.totalInstallments })}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Payment Timeline */}
      <Card>
        <CardTitle>{t('payments.title')}</CardTitle>
        <div className="mt-3">
          <PaymentTimeline
            payments={loan.payments}
            onPaymentTap={(payment) => setSelectedPayment(payment as PaymentItem)}
          />
        </div>
      </Card>

      {/* Payment Mark Modal */}
      {selectedPayment && (
        <PaymentMarkModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onSuccess={() => {
            setSelectedPayment(null);
            fetchLoan();
          }}
        />
      )}
    </div>
  );
}
