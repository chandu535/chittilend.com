import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/shared/EmptyState';
import { InlineSkeleton } from '@/components/ui/PageSkeleton';
import { NameDisplay } from '@/components/shared/NameDisplay';
import { DateDisplay } from '@/components/shared/DateDisplay';
import { listNotifications } from '@/server/functions/notifications';

type Row = Awaited<ReturnType<typeof listNotifications>>[number];

const STATUS_STYLE: Record<string, string> = {
  sent: 'bg-emerald-50 text-emerald-700',
  failed: 'bg-red-50 text-red-600',
  pending: 'bg-amber-50 text-amber-700',
};

/**
 * What the reminder cron actually did. Without this a failed send is invisible — the
 * borrower simply never hears from us and nobody knows.
 */
export function NotificationLog() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setRows(await listNotifications({ data: { limit: 50 } }));
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const failed = rows.filter((r) => r.status === 'failed').length;

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CardTitle>{t('settings.notifications')}</CardTitle>
          {failed > 0 && (
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
              {t('settings.notificationsFailed', { count: failed })}
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
          {t('common.refresh')}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, i) => <InlineSkeleton key={i} className="h-12" />)}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState title={t('settings.noNotifications')} />
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.id} className="rounded-lg border border-slate-100 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    <NameDisplay name={row.borrowerName} nameTelugu={row.borrowerNameTelugu} />
                    {row.loanNumber != null && (
                      <span className="ml-1.5 text-slate-400 tabular-nums">#{row.loanNumber}</span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {row.template} · <DateDisplay date={row.scheduledFor} className="inline" />
                  </p>
                </div>
                <span
                  className={clsx(
                    'shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold',
                    STATUS_STYLE[row.status] ?? 'bg-slate-100 text-slate-600',
                  )}
                >
                  {row.status}
                </span>
              </div>
              {row.error && (
                <p className="mt-2 break-words rounded bg-red-50/60 px-2 py-1 text-xs text-red-600">
                  {row.error}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
