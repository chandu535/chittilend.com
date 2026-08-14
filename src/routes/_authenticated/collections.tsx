import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { useStore } from '@tanstack/react-store';
import { authStore } from '@/lib/stores';
import { can } from '@/lib/permissions';
import { ScrollPage } from '@/components/layout/PageLayout';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';
import { NameDisplay } from '@/components/shared/NameDisplay';
import { BorrowerAvatar } from '@/components/shared/BorrowerAvatar';
import { AddEntrySheet } from '@/components/collections/AddEntrySheet';
import {
  applyAllCollectionEntries,
  applyCollectionEntry,
  discardCollectionEntry,
  listCollectionEntries,
} from '@/server/functions/collections';
import { formatPhone } from '@/lib/formatters';

export const Route = createFileRoute('/_authenticated/collections')({
  component: CollectionsPage,
});

type Book = Awaited<ReturnType<typeof listCollectionEntries>>;
type Entry = Book['rows'][number];

/**
 * The day book.
 *
 * Read like a bank statement, on purpose: one line per movement, money in green, money out
 * in red, and nothing else on the row. The person working this screen cannot read the app,
 * so the row carries a face, a name, a phone number and an amount — four things that can be
 * checked against the person standing in front of them — and no status, no dates, no terms.
 *
 * Nothing here has touched the ledger. Every line is a claim waiting for an admin, which is
 * what makes it safe to hand this screen to someone with no training.
 */
function CollectionsPage() {
  const { t } = useTranslation();
  const user = useStore(authStore, (s) => s.user);
  const canApply = can(user, 'collections.apply');

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [applyingAll, setApplyingAll] = useState(false);

  const load = useCallback(async () => {
    try {
      setBook(await listCollectionEntries({ data: {} }));
    } catch (err) {
      toast(err instanceof Error ? err.message : t('errors.generic'), 'error');
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const applyOne = async (id: string) => {
    setBusyId(id);
    try {
      const outcome = await applyCollectionEntry({ data: { id } });
      if (outcome.ok) toast(t('collections.applied'), 'success');
      else toast(outcome.error, 'error');
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : t('errors.generic'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const applyAll = async () => {
    setApplyingAll(true);
    try {
      const result = await applyAllCollectionEntries();
      if (result.failed === 0) toast(t('collections.appliedCount', { count: result.applied }), 'success');
      // Partial success is reported as partial. Saying "done" when two of five landed is
      // how money goes missing quietly.
      else toast(t('collections.appliedSome', { applied: result.applied, failed: result.failed }), 'info');
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : t('errors.generic'), 'error');
    } finally {
      setApplyingAll(false);
    }
  };

  const discard = async (id: string) => {
    setBusyId(id);
    try {
      await discardCollectionEntry({ data: { id } });
      toast(t('collections.discarded'), 'success');
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : t('errors.generic'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <ScrollPage><PageSkeleton variant="list" /></ScrollPage>;
  }

  const rows = book?.rows ?? [];

  return (
    <ScrollPage>
      <div className="mx-auto max-w-2xl">
        {/* The apply bar, for an admin with something waiting. Above the list because it is
            the only thing on this screen that spends money. */}
        {canApply && (book?.pendingCount ?? 0) > 0 && (
          <div className="mb-3 flex items-center gap-3 rounded-2xl border border-brand/20 bg-primary/5 p-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">
                {t('collections.waiting', { count: book!.pendingCount })}
              </p>
              <p className="text-xs text-slate-500 tabular">
                {book!.pendingTaken > 0 && (
                  <span className="text-emerald-600">+₹{book!.pendingTaken.toLocaleString('en-IN')}</span>
                )}
                {book!.pendingTaken > 0 && book!.pendingGiven > 0 && ' · '}
                {book!.pendingGiven > 0 && (
                  <span className="text-red-600">−₹{book!.pendingGiven.toLocaleString('en-IN')}</span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={applyAll}
              disabled={applyingAll}
              className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50"
            >
              {applyingAll ? <Spinner size="sm" className="text-white" /> : t('collections.applyAll')}
            </button>
          </div>
        )}

        {rows.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-slate-400">{t('collections.empty')}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-card">
            {rows.map((entry, i) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                first={i === 0}
                canApply={canApply}
                busy={busyId === entry.id}
                onApply={() => applyOne(entry.id)}
                onDiscard={() => discard(entry.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Big, fixed, and the only action on the screen for a collector. Sits above the
          bottom bar rather than inside it: this is the thing they came here to do. */}
      <button
        type="button"
        onClick={() => setAdding(true)}
        aria-label={t('collections.add')}
        className="fixed right-4 z-30 flex h-16 w-16 items-center justify-center rounded-full bg-gold text-on-gold shadow-lg transition-transform active:scale-95 md:bottom-6"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 5.5rem)' }}
      >
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>

      {adding && <AddEntrySheet onClose={() => setAdding(false)} onAdded={load} />}
    </ScrollPage>
  );
}

/**
 * One line of the statement.
 *
 * The amount is the largest thing on it and carries its own sign, because that is the only
 * part a collector needs to verify against the cash in their hand.
 */
function EntryRow({
  entry, first, canApply, busy, onApply, onDiscard,
}: {
  entry: Entry;
  first: boolean;
  canApply: boolean;
  busy: boolean;
  onApply: () => void;
  onDiscard: () => void;
}) {
  const { t } = useTranslation();
  const green = entry.kind === 'taken';
  const pending = entry.status === 'pending';
  const amount = parseFloat(entry.amount);

  return (
    <div className={clsx('px-3 py-3', !first && 'border-t border-slate-100')}>
      <div className="flex items-center gap-3">
        <BorrowerAvatar
          name={entry.borrowerName}
          nameTelugu={entry.borrowerNameTelugu}
          photoUrl={entry.borrowerPhotoUrl}
          size="lg"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {entry.loanNumber !== null && (
              <span className="shrink-0 text-[13px] font-bold tabular text-brand">#{entry.loanNumber}</span>
            )}
            <NameDisplay
              name={entry.borrowerName}
              nameTelugu={entry.borrowerNameTelugu}
              className="truncate text-[16px] font-semibold text-slate-900"
            />
          </div>
          <p className="truncate text-sm text-slate-400">{formatPhone(entry.borrowerMobile)}</p>
        </div>

        <div className="shrink-0 text-right">
          <p className={clsx('text-[19px] font-bold tabular', green ? 'text-emerald-600' : 'text-red-600')}>
            {green ? '+' : '−'}₹{amount.toLocaleString('en-IN')}
          </p>
          {/* A tick, not the word "applied". The row is read by someone who cannot read. */}
          {!pending && (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {t('collections.done')}
            </span>
          )}
        </div>
      </div>

      {entry.lastError && (
        <p className="mt-2 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs text-red-700">{entry.lastError}</p>
      )}

      {/* Only an admin sees these, and only while the row is still a claim. */}
      {canApply && pending && (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={onApply}
            disabled={busy}
            className="flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary text-sm font-semibold text-on-primary disabled:opacity-50"
          >
            {busy ? <Spinner size="sm" className="text-white" /> : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {t('collections.apply')}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onDiscard}
            disabled={busy}
            className="flex min-h-10 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-500 disabled:opacity-50"
          >
            {t('collections.discard')}
          </button>
        </div>
      )}
    </div>
  );
}
