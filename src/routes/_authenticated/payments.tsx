import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { DateDisplay } from '@/components/shared/DateDisplay';
import { NameDisplay } from '@/components/shared/NameDisplay';
import { PaymentMarkModal } from '@/components/loans/PaymentMarkModal';
import {
  listUpcomingPayments,
  listOverduePayments,
  listRecentPayments,
  bulkUpdateOverdueStatus,
} from '@/server/functions/payments';

export const Route = createFileRoute('/_authenticated/payments')({
  component: PaymentsPage,
});

type Tab = 'upcoming' | 'overdue' | 'recent';

type PaymentRow = {
  id: string;
  loanId: string;
  installmentNumber: number;
  dueDate: string;
  amountDue: string;
  amountPaid: string;
  paidDate: string | null;
  status: 'pending' | 'paid' | 'partial' | 'overdue' | 'waived';
  borrowerName: string;
  borrowerMobile: string;
  loanPrimaryAmount: string;
};

function PaymentsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PaymentRow[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRow | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Refresh overdue statuses on load
      if (tab === 'overdue') {
        await bulkUpdateOverdueStatus();
      }

      let result;
      if (tab === 'upcoming') {
        result = await listUpcomingPayments({ data: { days: 14 } });
      } else if (tab === 'overdue') {
        result = await listOverduePayments();
      } else {
        result = await listRecentPayments();
      }
      setData(result as unknown as PaymentRow[]);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'upcoming', label: t('payments.upcoming') },
    { key: 'overdue', label: t('payments.overdue') },
    { key: 'recent', label: t('payments.recent') },
  ];

  const isActionable = tab !== 'recent';

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-slate-900">{t('payments.title')}</h2>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors min-h-[40px] ${
              tab === t.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : data.length === 0 ? (
        <EmptyState
          title={tab === 'overdue' ? t('payments.noOverdue') : t('payments.noUpcoming')}
        />
      ) : (
        <>
          {/* Mobile: Card view */}
          <div className="sm:hidden space-y-3">
            {data.map((p) => (
              <Card key={p.id}>
                <div className="flex items-center justify-between mb-2">
                  <Link
                    to="/loans/$loanId"
                    params={{ loanId: p.loanId }}
                    className="font-medium text-slate-900 hover:text-primary"
                  >
                    <NameDisplay name={p.borrowerName} />
                  </Link>
                  <Badge status={p.status}>{t(`payments.${p.status}`)}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">
                    {t('payments.installmentNo', { number: p.installmentNumber })}
                  </span>
                  <CurrencyDisplay amount={parseFloat(p.amountDue)} className="font-semibold" />
                </div>
                <div className="flex items-center justify-between mt-1 text-sm">
                  <DateDisplay
                    date={tab === 'recent' && p.paidDate ? p.paidDate : p.dueDate}
                    className="text-slate-500"
                  />
                  {isActionable && (
                    <Button size="sm" onClick={() => setSelectedPayment(p)}>
                      {t('payments.markPaid')}
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop: Table view */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="pb-3 font-medium">{t('borrowers.name')}</th>
                  <th className="pb-3 font-medium">{t('payments.installmentNo', { number: '' }).replace('#', '#')}</th>
                  <th className="pb-3 font-medium">
                    {tab === 'recent' ? t('payments.paidDate') : t('payments.dueDate')}
                  </th>
                  <th className="pb-3 font-medium">{t('payments.amountDue')}</th>
                  <th className="pb-3 font-medium">{t('common.status')}</th>
                  {isActionable && <th className="pb-3 font-medium">{t('common.actions')}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((p) => (
                  <tr
                    key={p.id}
                    className={`hover:bg-slate-50 ${p.status === 'overdue' ? 'bg-red-50/50' : ''}`}
                  >
                    <td className="py-3">
                      <Link
                        to="/loans/$loanId"
                        params={{ loanId: p.loanId }}
                        className="font-medium text-slate-900 hover:text-primary"
                      >
                        <NameDisplay name={p.borrowerName} />
                      </Link>
                    </td>
                    <td className="py-3 text-slate-600">
                      #{p.installmentNumber}
                    </td>
                    <td className="py-3">
                      <DateDisplay
                        date={tab === 'recent' && p.paidDate ? p.paidDate : p.dueDate}
                        className="text-slate-600"
                      />
                    </td>
                    <td className="py-3">
                      <CurrencyDisplay amount={parseFloat(p.amountDue)} className="font-medium" />
                    </td>
                    <td className="py-3">
                      <Badge status={p.status}>{t(`payments.${p.status}`)}</Badge>
                    </td>
                    {isActionable && (
                      <td className="py-3">
                        <Button size="sm" onClick={() => setSelectedPayment(p)}>
                          {t('payments.markPaid')}
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Payment Mark Modal */}
      {selectedPayment && (
        <PaymentMarkModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onSuccess={() => {
            setSelectedPayment(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
