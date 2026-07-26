import { useCallback, useSyncExternalStore } from 'react';

/**
 * SSR-safe media query. Returns `false` during server render and on the first client
 * paint, then corrects after hydration — so it never causes a hydration mismatch.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    const list = window.matchMedia(query);
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, [query]);

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Matches Tailwind's `lg`, the breakpoint where lists switch from cards to tables. */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}
