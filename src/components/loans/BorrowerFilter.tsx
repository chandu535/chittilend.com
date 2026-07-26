import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { searchBorrowers } from '@/server/functions/borrowers';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useLocalizedName } from '@/components/shared/NameDisplay';
import { Spinner } from '@/components/ui/Spinner';
import { formatPhone } from '@/lib/formatters';

export type BorrowerOption = {
  id: string;
  name: string;
  nameTelugu: string | null;
  mobile: string;
  area: string | null;
};

interface BorrowerFilterProps {
  value: BorrowerOption | null;
  onChange: (borrower: BorrowerOption | null) => void;
  className?: string;
}

/**
 * Narrows a loan list to one borrower.
 *
 * Distinct from the free-text search beside it: search matches a name pattern, so two
 * borrowers who share a name come back together. This pins to one person by id, which
 * is what "show me their loans" actually means when names repeat — and they do.
 *
 * The panel is portalled to the body and positioned against the trigger's rect. The
 * filter row scrolls horizontally on mobile and sits inside a pinned header, either of
 * which would clip an absolutely-positioned dropdown.
 */
export function BorrowerFilter({ value, onChange, className }: BorrowerFilterProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BorrowerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebouncedValue(query, 250);

  const selectedName = useLocalizedName(value?.name ?? '', value?.nameTelugu);

  const reposition = useCallback(() => {
    if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect());
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setResults([]);
  }, []);

  // Follow the trigger while the page moves underneath it.
  useEffect(() => {
    if (!open) return;
    reposition();
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open, reposition]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { close(); triggerRef.current?.focus(); }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, close]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // A stale response must not overwrite a newer one: typing fast fires several requests
  // and they do not necessarily come back in order.
  useEffect(() => {
    if (!open) return;
    const term = debouncedQuery.trim();
    if (!term) { setResults([]); setLoading(false); return; }

    let cancelled = false;
    setLoading(true);
    searchBorrowers({ data: { query: term } })
      .then((rows) => { if (!cancelled) setResults(rows as BorrowerOption[]); })
      .catch(() => { if (!cancelled) setResults([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedQuery, open]);

  const term = debouncedQuery.trim();

  return (
    <>
      <div className={clsx('flex shrink-0 items-center gap-1.5', className)}>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => (open ? close() : setOpen(true))}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={clsx(
            'inline-flex min-h-10 max-w-[190px] items-center gap-1.5 rounded-full border px-3.5 py-2',
            'text-sm font-medium transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
            value
              ? 'border-primary bg-primary text-white'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
          )}
        >
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a7.5 7.5 0 1115 0v.75h-15v-.75z" />
          </svg>
          <span className="truncate">{value ? selectedName : t('loans.filterBorrower')}</span>
          {!value && (
            <svg className="h-3.5 w-3.5 shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>

        {/* A separate control, so clearing never reopens the panel. */}
        {value && (
          <button
            type="button"
            onClick={() => { onChange(null); close(); }}
            aria-label={t('loans.filterBorrowerClear')}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {open && rect && createPortal(
        <div
          ref={panelRef}
          role="listbox"
          className="fixed z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
          style={{
            // Clamped to the viewport so the panel never hangs off a narrow screen.
            top: Math.min(rect.bottom + 8, window.innerHeight - 240),
            left: Math.max(12, Math.min(rect.left, window.innerWidth - 312)),
            width: Math.min(300, window.innerWidth - 24),
          }}
        >
          <div className="border-b border-slate-100 p-2">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('loans.filterBorrowerSearch')}
              className="min-h-10 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="max-h-64 overflow-y-auto overscroll-contain">
            {loading ? (
              <div className="flex justify-center py-6"><Spinner size="sm" /></div>
            ) : !term ? (
              <p className="px-4 py-6 text-center text-xs text-slate-400">{t('loans.filterBorrowerHint')}</p>
            ) : results.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-slate-400">{t('borrowers.noBorrowers')}</p>
            ) : (
              results.map((b) => (
                <BorrowerRow
                  key={b.id}
                  borrower={b}
                  selected={b.id === value?.id}
                  onSelect={() => { onChange(b); close(); }}
                />
              ))
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

function BorrowerRow({ borrower, selected, onSelect }: {
  borrower: BorrowerOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const name = useLocalizedName(borrower.name, borrower.nameTelugu);

  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={clsx(
        'flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors',
        selected ? 'bg-primary/5' : 'hover:bg-slate-50',
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">{name}</p>
        <p className="truncate text-xs text-slate-400">
          {formatPhone(borrower.mobile)}
          {borrower.area ? ` · ${borrower.area}` : ''}
        </p>
      </div>
      {selected && (
        <svg className="h-4 w-4 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  );
}
