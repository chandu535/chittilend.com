import { useEffect, useState } from 'react';
import { suggestTelugu } from '@/server/functions/transliteration';
import { toTelugu, hasTeluguScript, hasLatinScript } from '@/lib/transliterate';
import { useDebouncedValue } from '@/lib/useDebouncedValue';

/**
 * The Telugu reading of what has been typed, so searching in English also finds names
 * stored in Telugu.
 *
 * Most names in this ledger are stored in Telugu script, which made them unreachable by
 * anyone typing on an English keyboard — the name was there, the search found nothing.
 * Typing "venkata" now also searches "వెంకట".
 *
 * The local rule table answers immediately so there is always something to search and to
 * show, and Google Input Tools replaces it a moment later when it responds, since it is
 * markedly better on real names. A failure leaves the local guess in place rather than
 * surfacing an error: a rough transliteration still finds people.
 *
 * Returns an empty string when the input is already Telugu, or has nothing to convert.
 */
export function useTeluguSearchTerm(input: string): {
  /** The best reading, for showing beside what was typed. */
  telugu: string;
  /** Every reading worth searching — the ledger does not always use the first. */
  candidates: string[];
  refining: boolean;
} {
  const trimmed = input.trim();
  // Already Telugu, or not letters at all (a mobile number), so there is nothing to do.
  const convertible = trimmed.length >= 2 && hasLatinScript(trimmed) && !hasTeluguScript(trimmed);

  const immediate = convertible ? toTelugu(trimmed) : '';
  const [refined, setRefined] = useState<string[]>([]);
  const [refinedFor, setRefinedFor] = useState('');
  const [refining, setRefining] = useState(false);
  const debounced = useDebouncedValue(trimmed, 350);

  useEffect(() => {
    if (!convertible || debounced.length < 2) { setRefined([]); setRefinedFor(''); setRefining(false); return; }

    let cancelled = false;
    setRefining(true);
    suggestTelugu({ data: { text: debounced } })
      .then((r) => {
        if (cancelled) return;
        setRefined(r.suggestions.slice(0, 3));
        setRefinedFor(debounced);
      })
      .catch(() => { /* the local guess stands */ })
      .finally(() => { if (!cancelled) setRefining(false); });
    return () => { cancelled = true; };
  }, [debounced, convertible]);

  // The refined value applies only while it still corresponds to what is typed, so a
  // stale suggestion never sits under newer text.
  const usable = refined.length && refinedFor === trimmed ? refined : (immediate ? [immediate] : []);
  return {
    telugu: usable[0] ?? '',
    candidates: usable,
    refining: refining && refinedFor !== trimmed,
  };
}
