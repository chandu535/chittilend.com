import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { DateDisplay } from '@/components/shared/DateDisplay';
import { NameDisplay } from '@/components/shared/NameDisplay';
import { toast } from '@/components/ui/Toast';
import { getCapitalBalance, getCapitalLog, addInvestment } from '@/server/functions/capital';

export const Route = createFileRoute('/_authenticated/capital')({
  component: CapitalPage,
});

type LogEntry = {
  id: string;
  eventDate: Date | string;
  eventType: 'investment' | 'collection' | 'disbursement';
  amount: string;
  runningBalance: string;
  referenceLoanId: string | null;
  referencePaymentId: string | null;
  notes: string | null;
  borrowerName: string | null;
};

const eventColors: Record<string, string> = {
  investment: 'bg-emerald-100 text-emerald-700',
  collection: 'bg-blue-100 text-blue-700',
  disbursement: 'bg-red-100 text-red-700',
};

function CapitalPage() {
  const { t } = useTranslation();
  const [balance, setBalance] = useState<number>(0);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvestModal, setShowInvestModal] = useState(false);

  // Filters
  const [eventType, setEventType] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [balResult, logResult] = await Promise.all([
        getCapitalBalance(),
        getCapitalLog({
          data: { eventType, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined },
        }),
      ]);
      setBalance(balResult.balance);
      setLog(logResult as unknown as LogEntry[]);
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  }, [eventType, dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">{t('capital.title')}</h2>
        <Button size="sm" onClick={() => setShowInvestModal(true)}>
          {t('capital.addInvestment')}
        </Button>
      </div>

      {/* Balance Card */}
      <Card>
        <p className="text-sm text-slate-500">{t('capital.balance')}</p>
        <CurrencyDisplay
          amount={balance}
          className="text-3xl font-bold text-slate-900 mt-1"
        />
      </Card>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            options={[
              { value: 'all', label: t('common.all') },
              { value: 'investment', label: t('capital.investment') },
              { value: 'collection', label: t('capital.collection') },
              { value: 'disbursement', label: t('capital.disbursement') },
            ]}
          />
          <DatePicker
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder={t('analytics.from')}
          />
          <DatePicker
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder={t('analytics.to')}
          />
        </div>
      </Card>

      {/* Log */}
      <Card>
        <CardTitle>{t('capital.log')}</CardTitle>
        <div className="mt-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : log.length === 0 ? (
            <EmptyState title={t('common.noData')} />
          ) : (
            <div className="space-y-0">
              {log.map((entry, index) => {
                const isLast = index === log.length - 1;
                const isPositive = entry.eventType !== 'disbursement';

                return (
                  <div key={entry.id} className="flex gap-3">
                    {/* Timeline dot + line */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${eventColors[entry.eventType]}`}
                      >
                        {entry.eventType === 'investment' && '+'}
                        {entry.eventType === 'collection' && '\u2713'}
                        {entry.eventType === 'disbursement' && '-'}
                      </div>
                      {!isLast && (
                        <div className="w-0.5 flex-1 min-h-[16px] bg-slate-200" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 rounded-lg border border-slate-100 p-3 mb-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${eventColors[entry.eventType].split(' ')[1]}`}>
                          {t(`capital.${entry.eventType}`)}
                        </span>
                        <DateDisplay
                          date={typeof entry.eventDate === 'string' ? entry.eventDate : new Date(entry.eventDate).toISOString().split('T')[0]}
                          className="text-xs text-slate-400"
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <CurrencyDisplay
                          amount={parseFloat(entry.amount)}
                          className={`text-sm font-semibold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}
                        />
                        <span className="text-xs text-slate-400">
                          {t('capital.balance')}: <CurrencyDisplay amount={parseFloat(entry.runningBalance)} className="inline" />
                        </span>
                      </div>
                      {entry.borrowerName && (
                        <p className="mt-1 text-xs text-slate-500"><NameDisplay name={entry.borrowerName} /></p>
                      )}
                      {entry.notes && (
                        <p className="mt-1 text-xs text-slate-400">{entry.notes}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Add Investment Modal */}
      {showInvestModal && (
        <InvestmentModal
          onClose={() => setShowInvestModal(false)}
          onSuccess={() => {
            setShowInvestModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

function InvestmentModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      toast(t('common.required'), 'error');
      return;
    }
    setLoading(true);
    try {
      await addInvestment({ data: { amount: parsed, notes: notes || undefined } });
      toast(t('capital.addInvestment'), 'success');
      onSuccess();
    } catch (err) {
      toast(err instanceof Error ? err.message : t('errors.generic'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-xl">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between rounded-t-2xl">
          <h3 className="text-lg font-semibold text-slate-900">{t('capital.addInvestment')}</h3>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          <Input
            label={t('capital.investmentAmount')}
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
            inputMode="numeric"
            lang="en"
            leftIcon={<span className="text-slate-500 text-sm">₹</span>}
            autoFocus
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('common.notes')}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              placeholder={t('common.notes')}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmit} loading={loading} className="flex-1">
              {t('capital.addInvestment')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
