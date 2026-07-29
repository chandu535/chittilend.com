import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollPage } from '@/components/layout/PageLayout';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { toast } from '@/components/ui/Toast';
import { getSheetStatus, triggerSheetSync } from '@/server/functions/sheet';
import { formatRelativeTime } from '@/lib/formatters';

export const Route = createFileRoute('/_authenticated/sheet')({
  component: SheetPage,
});

type Status = Awaited<ReturnType<typeof getSheetStatus>>;

function SheetPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'en' | 'te';

  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const load = async () => {
    try {
      setStatus(await getSheetStatus());
    } catch (error) {
      toast(error instanceof Error ? error.message : t('errors.generic'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await triggerSheetSync();
      setStatus(result.status);
      if (result.outcome.status === 'failed') {
        toast(result.outcome.error, 'error');
      } else if (result.outcome.status === 'synced') {
        toast(t('sheet.syncedToast'), 'success');
      } else {
        toast(t('sheet.syncBusy'), 'info');
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : t('errors.generic'), 'error');
    } finally {
      setSyncing(false);
    }
  };

  /**
   * Fetched rather than followed as a link, because the endpoint can fail in ways worth
   * reporting — Google unreachable, credentials not set — and a plain `<a download>` would
   * hand the user a file containing the error message instead of saying so.
   */
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch('/api/sheet/download');
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? t('errors.generic'));
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `sripay-${new Date().toISOString().slice(0, 10)}.xlsx`;
      anchor.click();
      URL.revokeObjectURL(url);
      // The endpoint syncs before exporting, so what is on screen is now out of date.
      load();
    } catch (error) {
      toast(error instanceof Error ? error.message : t('errors.generic'), 'error');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <ScrollPage>
        <PageSkeleton variant="list" />
      </ScrollPage>
    );
  }

  const configured = status?.configured ?? false;

  return (
    <ScrollPage>
      <div className="mx-auto max-w-2xl space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">{t('sheet.title')}</h2>

        <Card padding="lg">
          <CardTitle>{t('sheet.downloadTitle')}</CardTitle>
          <CardDescription>{t('sheet.downloadHint')}</CardDescription>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button
              size="lg"
              onClick={handleDownload}
              loading={downloading}
              disabled={!configured}
              className="sm:flex-1"
            >
              <DownloadIcon />
              {t('sheet.download')}
            </Button>
            {status?.url && (
              <a
                href={status.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-card px-6 text-[15px] font-semibold text-brand transition-colors hover:bg-primary/10"
              >
                {t('sheet.open')}
              </a>
            )}
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle>{t('sheet.statusTitle')}</CardTitle>
              <CardDescription>
                {!configured
                  ? t('sheet.notConfigured')
                  : status?.syncedAt
                    ? t('sheet.lastSynced', {
                        when: formatRelativeTime(status.syncedAt, { lang }),
                      })
                    : t('sheet.neverSynced')}
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleSync}
              loading={syncing}
              disabled={!configured}
            >
              {t('sheet.syncNow')}
            </Button>
          </div>

          {configured && (
            <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm">
              <div>
                <dt className="text-slate-400">{t('nav.loans')}</dt>
                <dd className="font-semibold text-slate-800">{status?.loanRows ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-400">{t('nav.borrowers')}</dt>
                <dd className="font-semibold text-slate-800">{status?.borrowerRows ?? '—'}</dd>
              </div>
            </dl>
          )}

          {/* Pending changes and a failure are different things and are said differently.
              The first is normal and resolves itself; the second needs someone to look. */}
          {configured && status?.dirtyAt && !status.lastError && (
            <p className="mt-3 text-sm text-amber-600">{t('sheet.pending')}</p>
          )}
          {status?.lastError && (
            <p className="mt-3 break-words rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {status.lastError}
            </p>
          )}
        </Card>
      </div>
    </ScrollPage>
  );
}

const DownloadIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
    />
  </svg>
);
