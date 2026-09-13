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
import { userFacingError } from '@/lib/userError';
import { NameDisplay } from '@/components/shared/NameDisplay';
import { BorrowerAvatar } from '@/components/shared/BorrowerAvatar';
import { ContactActions } from '@/components/shared/ContactActions';
import { AddEntrySheet } from '@/components/collections/AddEntrySheet';
import {
  applyAllCollectionEntries,
  applyCollectionEntry,
  discardCollectionEntry,
  listCollectionEntries,
} from '@/server/functions/collections';
import { formatPhone } from '@/lib/formatters';
import { useSpeech, isReadBackOn, setReadBackOn } from '@/lib/useSpeech';

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
  // Lifted here rather than called per row: the hook subscribes to voiceschanged, and
  // twenty rows would mean twenty listeners for one shared answer.
  const { speakEntry, available: canSpeak, voiceLabel } = useSpeech();
  // Mirrors the stored preference so the icon re-renders; speakEntry re-reads the store
  // itself, so this state is only ever about what the button looks like.
  const [speaking, setSpeaking] = useState(isReadBackOn());

  const load = useCallback(async () => {
    try {
      setBook(await listCollectionEntries({ data: {} }));
    } catch (err) {
      toast(userFacingError(err, t('errors.generic')), 'error');
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
      toast(userFacingError(err, t('errors.generic')), 'error');
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
      toast(userFacingError(err, t('errors.generic')), 'error');
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
      toast(userFacingError(err, t('errors.generic')), 'error');
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
        {/*
          Sound on or off, and — when the phone has no voice at all — the only place that
          says so. Settings is admin-only and this preference is per device, so the person
          who wants the talking to stop could not otherwise reach the switch.

          Left visible but disabled where there is no voice. That is not a dead control: it
          is the answer to "why is it not speaking", on the phone where the question comes
          up. The per-row replay button is hidden in the same case, because that one really
          would do nothing.
        */}
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            disabled={!canSpeak}
            onClick={() => { const next = !speaking; setReadBackOn(next); setSpeaking(next); }}
            aria-pressed={canSpeak && speaking}
            aria-label={canSpeak ? t('collections.readBack') : t('collections.voiceNone')}
            title={canSpeak ? `${t('collections.readBackHint')} — ${voiceLabel}` : t('collections.voiceNone')}
            className={clsx(
              'flex h-11 w-11 items-center justify-center rounded-full transition-colors',
              !canSpeak && 'text-slate-300',
              canSpeak && speaking && 'text-brand hover:bg-primary/10',
              canSpeak && !speaking && 'text-slate-400 hover:bg-slate-100',
            )}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H2v6h4l5 4V5z" />
              {canSpeak && speaking ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M22 9l-6 6m0-6l6 6" />
              )}
            </svg>
          </button>
        </div>

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
                canSpeak={canSpeak}
                onSpeak={() => speakEntry({
                  name: entry.borrowerName,
                  nameTelugu: entry.borrowerNameTelugu,
                  amount: parseFloat(entry.amount),
                  kind: entry.kind,
                })}
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
  entry, first, canApply, busy, canSpeak, onSpeak, onApply, onDiscard,
}: {
  entry: Entry;
  first: boolean;
  canApply: boolean;
  busy: boolean;
  canSpeak: boolean;
  onSpeak: () => void;
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
          <div className="flex items-center gap-1">
            <p className="truncate text-sm text-slate-400">{formatPhone(entry.borrowerMobile)}</p>
            {/* The collector is standing at the door, or trying to find it. Reaching the
                person is the action most likely to follow reading their name here. */}
            <ContactActions
              mobile={entry.borrowerMobile}
              name={entry.borrowerName}
              variant="icons"
              className="-my-2"
            />
          </div>
        </div>

        {/* Says the row aloud again. Not a convenience: the reading after saving happens
            once, and someone who cannot read the row has no other way back to it. Hidden
            where the device has no voice, rather than offered as a button that does
            nothing. */}
        {canSpeak && (
          <button
            type="button"
            onClick={onSpeak}
            aria-label={t('collections.readAloud')}
            title={t('collections.readAloud')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 active:bg-slate-200"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H2v6h4l5 4V5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13" />
            </svg>
          </button>
        )}

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
