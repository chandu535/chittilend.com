import { useEffect, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { searchLoans } from '@/server/functions/loans';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useTeluguSearchTerm } from '@/lib/useTeluguSearchTerm';
import { useScrollLock } from '@/lib/useScrollLock';
import { NameDisplay } from '@/components/shared/NameDisplay';
import { BorrowerAvatar } from '@/components/shared/BorrowerAvatar';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { Spinner } from '@/components/ui/Spinner';
import { VoiceInput } from '@/components/ui/VoiceInput';

type LoanHit = Awaited<ReturnType<typeof searchLoans>>[number];

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
  </svg>
);

/**
 * Jump from one loan to another without going back to the list.
 *
 * Collections are done by moving between loans, and the way back was Back, then find the
 * search box, then type, then tap — on a phone, with the list scrolled somewhere else by
 * the time you returned. This is the same search in the place you already are.
 *
 * Matching a loan number is the point of it. Loans are spoken about by number and that
 * number was the one thing the search could not find, so typing 16 searched borrower names
 * for "16" and returned nothing. It now finds loan #16 first, and the number is why this is
 * faster than the list: one identifier, one result, no scrolling.
 */
export function LoanSwitcher({ currentLoanId }: { currentLoanId: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LoanHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const debounced = useDebouncedValue(query, 250);
  // Typing in English has to find names stored in Telugu here as much as on the list.
  const { candidates } = useTeluguSearchTerm(query);

  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  // A stale response must not overwrite a newer one: typing fast fires several requests
  // and they do not necessarily return in order.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    searchLoans({ data: { query: debounced, queryTelugu: candidates, limit: 20 } })
      .then((rows) => { if (!cancelled) { setResults(rows); setLoaded(true); setActive(0); } })
      .catch(() => { if (!cancelled) { setResults([]); setLoaded(true); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, debounced, candidates.join('|')]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const close = () => {
    setOpen(false);
    setQuery('');
    setResults([]);
    setLoaded(false);
  };

  const go = (loan: LoanHit) => {
    close();
    // Same route, different params. Navigating to the loan you are already on would leave
    // the panel closing over an unchanged screen, which reads as the tap having missed.
    if (loan.id !== currentLoanId) navigate({ to: '/loans/$loanId', params: { loanId: loan.id } });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { close(); return; }
    if (!results.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (i + 1) % results.length); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (i - 1 + results.length) % results.length); }
    if (e.key === 'Enter') { e.preventDefault(); go(results[active]); }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('loans.findLoan')}
        className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <SearchIcon className="h-5 w-5" />
      </button>
    );
  }

  return (
    /* Fixed rather than a dropdown anchored to the button: on a phone the header is narrow
       and a panel hanging off it would be clipped by the page padding. Full width at the
       top is also where every other search on this app lives. */
    <div className="fixed inset-0 z-50 flex justify-center bg-black/40 px-3 pt-3 sm:pt-16">
      <div
        ref={panelRef}
        className="h-fit max-h-[85vh] w-full max-w-lg overflow-hidden rounded-2xl bg-card shadow-xl"
      >
        <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
          <SearchIcon className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t('loans.findLoanHint')}
            aria-label={t('loans.findLoan')}
            className="min-h-11 flex-1 bg-transparent text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {loading && <Spinner size="sm" />}
          <VoiceInput onResult={(text) => setQuery(text)} size="sm" />
          <button
            type="button"
            onClick={close}
            aria-label={t('common.close')}
            className="flex min-h-11 min-w-11 items-center justify-center text-slate-400 hover:text-slate-600"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto overscroll-contain py-1">
          {loaded && results.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-slate-400">{t('common.noMatches')}</p>
          )}

          {results.map((loan, i) => {
            const outstanding = Math.max(0, parseFloat(loan.totalRepayment) - parseFloat(loan.paidAmount));

            return (
              <button
                key={loan.id}
                type="button"
                onClick={() => go(loan)}
                onMouseEnter={() => setActive(i)}
                aria-current={loan.id === currentLoanId ? 'page' : undefined}
                className={clsx(
                  'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors',
                  i === active ? 'bg-slate-50' : 'hover:bg-slate-50',
                  loan.id === currentLoanId && 'opacity-50',
                )}
              >
                {/* The number leads, because it is what was typed and what is being looked
                    for. Everything else is confirmation that this is the right one. */}
                <span className="w-12 shrink-0 text-right text-[15px] font-bold tabular text-brand">
                  #{loan.loanNumber}
                </span>
                <BorrowerAvatar
                  name={loan.borrowerName}
                  nameTelugu={loan.borrowerNameTelugu}
                  photoUrl={loan.borrowerPhotoUrl}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <NameDisplay
                    name={loan.borrowerName}
                    nameTelugu={loan.borrowerNameTelugu}
                    className="block truncate text-sm font-medium text-slate-900"
                  />
                  {loan.borrowerArea && (
                    <p className="truncate text-xs text-slate-400">{loan.borrowerArea}</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <CurrencyDisplay amount={outstanding} className="text-sm font-semibold text-slate-900" />
                  <p className="text-[11px] text-slate-400">{t('loans.left')}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
