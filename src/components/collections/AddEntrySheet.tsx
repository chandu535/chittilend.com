import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { searchLoans } from '@/server/functions/loans';
import { searchBorrowers } from '@/server/functions/borrowers';
import { addCollectionEntry } from '@/server/functions/collections';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useTeluguSearchTerm } from '@/lib/useTeluguSearchTerm';
import { useScrollLock } from '@/lib/useScrollLock';
import { NameDisplay } from '@/components/shared/NameDisplay';
import { BorrowerAvatar } from '@/components/shared/BorrowerAvatar';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { Spinner } from '@/components/ui/Spinner';
import { VoiceInput } from '@/components/ui/VoiceInput';
import { toast } from '@/components/ui/Toast';
import { formatPhone } from '@/lib/formatters';
import { LIMITS } from '@/lib/constants';

type Kind = 'taken' | 'given';
type LoanHit = Awaited<ReturnType<typeof searchLoans>>[number];
type BorrowerHit = Awaited<ReturnType<typeof searchBorrowers>>[number];

/** What has been picked, flattened so the amount step does not care which search found it. */
interface Picked {
  borrowerId: string;
  loanId: string | null;
  loanNumber: number | null;
  name: string;
  nameTelugu: string | null;
  mobile: string | null;
  photoUrl: string | null;
}

/**
 * Writing one line in the day book.
 *
 * Built for someone who cannot read the screen. Three steps, one decision each, and the
 * decision is carried by colour and by a photograph rather than by words: green is money
 * coming in, red is money going out, and a face confirms the right person far faster than
 * a name they cannot read.
 *
 * The search is spoken more often than typed, which is why the microphone sits inside the
 * field rather than beside it, and why results lead with the photo.
 */
export function AddEntrySheet({ onClose, onAdded }: { onClose: () => void; onAdded: () => Promise<void> | void }) {
  const { t } = useTranslation();
  const [kind, setKind] = useState<Kind | null>(null);
  const [picked, setPicked] = useState<Picked | null>(null);

  useScrollLock(true);

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-canvas">
      <header className="flex items-center gap-2 border-b border-slate-200 bg-card px-3 py-2">
        <button
          type="button"
          onClick={() => {
            if (picked) setPicked(null);
            else if (kind) setKind(null);
            else onClose();
          }}
          aria-label={t('common.back')}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-bold text-slate-900">
          {kind === null ? t('collections.addTitle')
            : kind === 'taken' ? t('collections.tookTitle')
              : t('collections.gaveTitle')}
        </h2>
      </header>

      {kind === null && <ChooseKind onChoose={setKind} />}
      {kind !== null && picked === null && <PickWho kind={kind} onPick={setPicked} />}
      {kind !== null && picked !== null && (
        <EnterAmount
          kind={kind}
          picked={picked}
          // Reloaded before the sheet closes, not after. Closing first showed the list as
          // it was a moment ago — the entry the collector had just written was missing
          // from it, which on this screen reads as the entry not having saved.
          onDone={async () => { await onAdded(); onClose(); }}
        />
      )}
    </div>,
    document.body,
  );
}

/**
 * Which way the cash went.
 *
 * Two targets filling the screen, coloured and arrowed. Nothing else is on this step: it
 * is the only question where getting it wrong reverses the meaning of the entry.
 */
function ChooseKind({ onChoose }: { onChoose: (kind: Kind) => void }) {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 p-4">
      <button
        type="button"
        onClick={() => onChoose('taken')}
        className="flex min-h-[128px] flex-col items-center justify-center gap-2 rounded-3xl bg-emerald-50 ring-2 ring-emerald-600/30 transition-transform active:scale-[0.98]"
      >
        <svg className="h-12 w-12 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l6-6m-6 6l-6-6" />
        </svg>
        <span className="text-xl font-bold text-emerald-800">{t('collections.took')}</span>
      </button>

      <button
        type="button"
        onClick={() => onChoose('given')}
        className="flex min-h-[128px] flex-col items-center justify-center gap-2 rounded-3xl bg-red-50 ring-2 ring-red-600/30 transition-transform active:scale-[0.98]"
      >
        <svg className="h-12 w-12 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0l6 6m-6-6l-6 6" />
        </svg>
        <span className="text-xl font-bold text-red-800">{t('collections.gave')}</span>
      </button>
    </div>
  );
}

/**
 * Finding the person.
 *
 * Money taken searches loans, because the collector is paying into one and the loan number
 * is what gets quoted at a doorstep. Money given searches people, since the loan it will
 * become does not exist yet. Both accept Telugu, and both accept speech.
 */
function PickWho({ kind, onPick }: { kind: Kind; onPick: (p: Picked) => void }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [loanHits, setLoanHits] = useState<LoanHit[]>([]);
  const [borrowerHits, setBorrowerHits] = useState<BorrowerHit[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const debounced = useDebouncedValue(query, 250);
  const { candidates } = useTeluguSearchTerm(query);
  const teluguKey = candidates.join('|');

  useEffect(() => { inputRef.current?.focus(); }, []);

  // A stale response must not overwrite a newer one: typing fast fires several requests
  // and they do not necessarily come back in order.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const request = kind === 'taken'
      ? searchLoans({ data: { query: debounced, queryTelugu: candidates, limit: 25 } })
        // A repaid loan is not somewhere money can be paid into, and offering it would
        // produce an entry whose only possible outcome is failing at apply — on someone
        // else's screen, hours later. Filtered here rather than in searchLoans, which the
        // loan switcher shares and where finding a settled loan is the point.
        .then((rows) => { if (!cancelled) setLoanHits(rows.filter((r) => r.status !== 'completed')); })
      : searchBorrowers({ data: { query: debounced, queryTelugu: candidates, limit: 25 } })
        .then((rows) => { if (!cancelled) setBorrowerHits(rows as BorrowerHit[]); });

    request.catch(() => { if (!cancelled) { setLoanHits([]); setBorrowerHits([]); } })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [kind, debounced, teluguKey]);

  return (
    <>
      <div className="flex items-center gap-2 border-b border-slate-200 bg-card px-3 py-2">
        <svg className="h-5 w-5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('collections.searchHint')}
          aria-label={t('collections.searchHint')}
          className="min-h-12 flex-1 bg-transparent text-[17px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
        {loading && <Spinner size="sm" />}
        <VoiceInput onResult={(text) => setQuery(text)} prompt={t('collections.speakName')} />
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        {kind === 'taken' && loanHits.map((loan) => {
          const left = Math.max(0, parseFloat(loan.totalRepayment) - parseFloat(loan.paidAmount));
          return (
            <Row
              key={loan.id}
              name={loan.borrowerName}
              nameTelugu={loan.borrowerNameTelugu}
              photoUrl={loan.borrowerPhotoUrl}
              badge={`#${loan.loanNumber}`}
              sub={loan.borrowerArea}
              amount={left}
              amountLabel={t('loans.left')}
              onClick={() => onPick({
                borrowerId: loan.borrowerId,
                loanId: loan.id,
                loanNumber: loan.loanNumber,
                name: loan.borrowerName,
                nameTelugu: loan.borrowerNameTelugu,
                mobile: null,
                photoUrl: loan.borrowerPhotoUrl,
              })}
            />
          );
        })}

        {kind === 'given' && borrowerHits.map((b) => (
          <Row
            key={b.id}
            name={b.name}
            nameTelugu={b.nameTelugu}
            photoUrl={b.profilePhotoUrl}
            sub={b.mobile ? formatPhone(b.mobile) : b.area}
            onClick={() => onPick({
              borrowerId: b.id,
              loanId: null,
              loanNumber: null,
              name: b.name,
              nameTelugu: b.nameTelugu,
              mobile: b.mobile,
              photoUrl: b.profilePhotoUrl,
            })}
          />
        ))}

        {!loading && (kind === 'taken' ? loanHits : borrowerHits).length === 0 && (
          <p className="px-4 py-10 text-center text-slate-400">{t('common.noMatches')}</p>
        )}
      </div>
    </>
  );
}

/** One tappable person. Deliberately tall: this is used one-handed, outdoors, in a hurry. */
function Row({
  name, nameTelugu, photoUrl, badge, sub, amount, amountLabel, onClick,
}: {
  name: string;
  nameTelugu: string | null;
  photoUrl: string | null;
  badge?: string;
  sub?: string | null;
  amount?: number;
  amountLabel?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-slate-100 px-3 py-3 text-left transition-colors active:bg-slate-100"
    >
      <BorrowerAvatar name={name} nameTelugu={nameTelugu} photoUrl={photoUrl} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {badge && <span className="shrink-0 text-[15px] font-bold tabular text-brand">{badge}</span>}
          <NameDisplay name={name} nameTelugu={nameTelugu} className="truncate text-[17px] font-semibold text-slate-900" />
        </div>
        {sub && <p className="truncate text-sm text-slate-400">{sub}</p>}
      </div>
      {amount !== undefined && (
        <div className="shrink-0 text-right">
          <CurrencyDisplay amount={amount} className="text-[15px] font-semibold text-slate-700" />
          {amountLabel && <p className="text-[11px] text-slate-400">{amountLabel}</p>}
        </div>
      )}
    </button>
  );
}

/**
 * How much.
 *
 * The person stays on screen throughout — photo, name and the loan number — so the last
 * thing seen before committing is who this is about, not a form. The submit button is the
 * colour of the entry and carries the amount, so it reads as "take ₹5,000" rather than as
 * the word Submit.
 */
function EnterAmount({ kind, picked, onDone }: { kind: Kind; picked: Picked; onDone: () => Promise<void> }) {
  const { t } = useTranslation();
  const [raw, setRaw] = useState('');
  const [saving, setSaving] = useState(false);

  const amount = useMemo(() => Number(raw) || 0, [raw]);
  const green = kind === 'taken';

  const min = kind === 'given' ? LIMITS.MIN_LOAN_AMOUNT : 1;
  const tooSmall = amount > 0 && amount < min;
  const valid = amount > 0 && !tooSmall;

  const submit = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      await addCollectionEntry({
        data: {
          kind,
          borrowerId: picked.borrowerId,
          loanId: picked.loanId ?? undefined,
          amount,
        },
      });
      toast(t('collections.saved'), 'success');
      await onDone();
    } catch (err) {
      toast(err instanceof Error ? err.message : t('errors.generic'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      {/* Who this is about, pinned. */}
      <div className="flex items-center gap-3 border-b border-slate-200 bg-card px-4 py-3">
        <BorrowerAvatar name={picked.name} nameTelugu={picked.nameTelugu} photoUrl={picked.photoUrl} size="lg" />
        <div className="min-w-0">
          <NameDisplay name={picked.name} nameTelugu={picked.nameTelugu} className="block truncate text-[17px] font-bold text-slate-900" />
          {picked.loanNumber !== null && (
            <p className="text-sm font-semibold tabular text-brand">#{picked.loanNumber}</p>
          )}
          {picked.mobile && <p className="text-sm text-slate-400">{formatPhone(picked.mobile)}</p>}
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4">
        <div className={clsx(
          'flex items-center justify-center gap-1 rounded-3xl py-8',
          green ? 'bg-emerald-50' : 'bg-red-50',
        )}>
          <span className={clsx('text-4xl font-bold', green ? 'text-emerald-700' : 'text-red-700')}>₹</span>
          <input
            value={raw}
            onChange={(e) => setRaw(e.target.value.replace(/[^\d]/g, '').slice(0, 8))}
            inputMode="numeric"
            autoFocus
            lang="en"
            aria-label={t('collections.amount')}
            placeholder="0"
            className={clsx(
              'w-full bg-transparent text-center text-5xl font-bold tabular focus:outline-none',
              green ? 'text-emerald-800 placeholder:text-emerald-300' : 'text-red-800 placeholder:text-red-300',
            )}
          />
        </div>

        {tooSmall && (
          <p className="mt-3 text-center text-sm text-red-600">
            {t('collections.minimum', { amount: min.toLocaleString('en-IN') })}
          </p>
        )}
      </div>

      <div className="border-t border-slate-200 bg-card p-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}>
        <div className="mx-auto w-full max-w-sm">
        <button
          type="button"
          onClick={submit}
          disabled={!valid || saving}
          className={clsx(
            'flex min-h-[64px] w-full items-center justify-center gap-3 rounded-2xl text-xl font-bold text-white',
            'transition-transform active:scale-[0.99] disabled:opacity-40',
            green ? 'bg-success' : 'bg-danger',
          )}
        >
          {saving ? <Spinner size="sm" className="text-white" /> : (
            <>
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="tabular">₹{amount.toLocaleString('en-IN')}</span>
            </>
          )}
        </button>
        </div>
      </div>
    </div>
  );
}
