import { useCallback, useRef, useState } from 'react';

/**
 * Filter state that survives leaving the page and coming back.
 *
 * Every list here resets when you navigate away. That is fine on a screen you browse and
 * wrong on a screen you work: filter the loans to one borrower, open a loan to take a
 * payment, come back — and the list is showing all four hundred again, so the filter has to
 * be re-applied for every single loan in the batch. The collections round is a batch by
 * definition.
 *
 * Held in memory rather than in localStorage, and that is the deliberate half. A filter is
 * about what you are doing right now, not a setting: it should outlive a navigation and die
 * with the tab. Storing it would mean opening the app tomorrow to a list still narrowed to
 * one area, with no memory of having asked for that — which reads as missing data rather
 * than as a filter, and is exactly how somebody concludes their loans have disappeared.
 *
 * The URL would be the other reasonable home, and is better in one way: a filtered list
 * becomes a link you can send. It is a much wider change — every list would need its search
 * params declared and its back-button behaviour thought through — so this solves the
 * reported problem at the size of the problem.
 */

/** Survives navigation, cleared when the tab closes. */
const memory = new Map<string, unknown>();

/**
 * Like `useState`, but keyed and remembered for the life of the tab.
 *
 * `key` must be unique per page and per field — `loans:status`, `borrowers:area`. Two pages
 * sharing a key share the value, which is occasionally what you want and usually a bug, so
 * the keys are spelled out at each call site rather than derived from anything.
 */
export function useStickyState<T>(key: string, initial: T): [T, (next: T) => void] {
  // The initialiser runs once; without the ref a re-render would read the map again and
  // could reset a value that has just been changed.
  const [value, setValue] = useState<T>(() => (memory.has(key) ? (memory.get(key) as T) : initial));
  const keyRef = useRef(key);
  keyRef.current = key;

  const set = useCallback((next: T) => {
    memory.set(keyRef.current, next);
    setValue(next);
  }, []);

  return [value, set];
}

/** Forgets everything remembered under a prefix — for a Clear filters control. */
export function clearStickyState(prefix: string) {
  for (const key of [...memory.keys()]) {
    if (key.startsWith(prefix)) memory.delete(key);
  }
}

/** Test seam. Nothing in the app calls this. */
export function resetStickyState() {
  memory.clear();
}
