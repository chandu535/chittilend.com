import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { searchBorrowers } from '@/server/functions/borrowers';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useLocalizedName } from '@/components/shared/NameDisplay';
import { BorrowerAvatar } from '@/components/shared/BorrowerAvatar';
import { Spinner } from '@/components/ui/Spinner';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import { formatPhone } from '@/lib/formatters';
import { clsx } from 'clsx';
import { VoiceInput } from '@/components/ui/VoiceInput';

export type BorrowerOption = {
  id: string;
  name: string;
  nameTelugu: string | null;
  mobile: string;
  area: string | null;
  profilePhotoUrl: string | null;
  loanCount?: number;
};

interface BorrowerFilterProps {
  value: BorrowerOption | null;
  onChange: (borrower: BorrowerOption | null) => void;
  className?: string;
}

const PersonIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a7.5 7.5 0 1115 0v.75h-15v-.75z" />
  </svg>
);

/**
 * Narrows a loan list to one borrower.
 *
 * Different from the free-text search beside it: search matches a name pattern, so two
 * borrowers sharing a name come back together. This pins to one person by id, which is
 * what "show me their loans" means when names repeat — and in this ledger they do.
 *
 * The list is there before you type anything, ordered by who has the most loans, because
 * the people you filter by are the people you chase. Each row carries a photo and a phone
 * number: names repeat, and a face plus a number is how you tell two of them apart.
 */
export function BorrowerFilter({ value, onChange, className }: BorrowerFilterProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BorrowerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebouncedValue(query, 250);

  const selectedName = useLocalizedName(value?.name ?? '', value?.nameTelugu);

  // A stale response must not overwrite a newer one: typing fast fires several requests
  // and they do not necessarily return in order.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    searchBorrowers({ data: { query: debouncedQuery, limit: 30 } })
      .then((rows) => { if (!cancelled) { setResults(rows as BorrowerOption[]); setLoaded(true); } })
      .catch(() => { if (!cancelled) { setResults([]); setLoaded(true); } })
      .finally(() => { if (!cancelled) setLoading(false); })
    ;
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  return (
    <FilterDropdown
      label={t('loans.filterBorrower')}
      value={value ? selectedName : null}
      icon={<PersonIcon />}
      onClear={() => onChange(null)}
      clearLabel={t('loans.filterBorrowerClear')}
      className={className}
      panelWidth={340}
    >
      {(close) => (
        <>
          <div className="flex items-center gap-1 border-b border-slate-100 p-2">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('loans.filterBorrowerSearch')}
              className="min-h-11 w-full min-w-0 flex-1 rounded-xl bg-slate-50 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <VoiceInput size="sm" onResult={setQuery} />
          </div>

          <div className="max-h-[min(60dvh,22rem)] overflow-y-auto overscroll-contain">
            {loading && !loaded ? (
              <div className="flex justify-center py-8"><Spinner size="sm" /></div>
            ) : results.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-slate-400">{t('borrowers.noBorrowers')}</p>
            ) : (
              <div className={clsx('py-1', loading && 'opacity-60')}>
                {results.map((b) => (
                  <BorrowerRow
                    key={b.id}
                    borrower={b}
                    selected={b.id === value?.id}
                    onSelect={() => { onChange(b); setQuery(''); close(); }}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </FilterDropdown>
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
        'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors',
        selected ? 'bg-primary/5' : 'hover:bg-slate-50',
      )}
    >
      {/* Presentational here — tapping the row picks the borrower rather than opening
          the photo, so the avatar must not swallow the click. */}
      <span className="pointer-events-none shrink-0">
        <BorrowerAvatar name={borrower.name} nameTelugu={borrower.nameTelugu} photoUrl={borrower.profilePhotoUrl} size="sm" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-slate-900">{name}</span>
        <span className="block truncate text-xs text-slate-400">
          {formatPhone(borrower.mobile)}
          {borrower.area ? ` · ${borrower.area}` : ''}
        </span>
      </span>

      {borrower.loanCount !== undefined && (
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-slate-500">
          {borrower.loanCount}
        </span>
      )}
      <svg
        className={clsx('h-4 w-4 shrink-0 text-primary', selected ? 'opacity-100' : 'opacity-0')}
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </button>
  );
}
