import { useCallback, useEffect, useRef, useState } from 'react';
import { cachedRequest } from './requestCache';
import { isConnectionError } from './connection';
import { useIsDesktop } from './useMediaQuery';

export interface PageResult<T> {
  items: T[];
  total: number;
  totalPages: number;
  /** Anything else the endpoint returns, e.g. facet counts. Carried through untouched. */
  [key: string]: unknown;
}

interface Options<T> {
  /** Stable cache key for a page. Must include every filter value and the size. */
  cacheKey: (page: number, pageSize: number) => string;
  fetchPage: (page: number, pageSize: number) => Promise<PageResult<T>>;
  /** Filter/search values. Any change resets to page 1 and clears accumulated items. */
  resetKey: string;
  /** Rows per page in the desktop table. */
  pageSize?: number;
  /**
   * Rows per append on mobile. Smaller than the desktop page on purpose: a phone shows
   * two or three cards at a time, so a big first page just delays the first paint, and
   * smaller appends keep each one cheap.
   */
  mobilePageSize?: number;
  ttlMs?: number;
}

/**
 * One list, two behaviours: numbered pages on desktop, append-on-scroll on mobile.
 *
 * Both share the same server-side pagination, so the only difference is whether a new
 * page replaces the items or is appended. Switching viewport class resets to page 1
 * rather than trying to reconcile two incompatible scroll positions.
 */
export function usePaginatedList<T>({
  cacheKey,
  fetchPage,
  resetKey,
  pageSize: desktopPageSize = 10,
  mobilePageSize = 10,
  ttlMs = 15_000,
}: Options<T>) {
  const isDesktop = useIsDesktop();
  // User-chosen rows per page on desktop; mobile always appends a fixed small batch.
  const [chosenPageSize, setChosenPageSize] = useState(desktopPageSize);
  const pageSize = isDesktop ? chosenPageSize : mobilePageSize;

  const [page, setPage] = useState(1);
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [meta, setMeta] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [appending, setAppending] = useState(false);
  const [error, setError] = useState<unknown>(null);

  // Guards against a slow page-1 response overwriting a newer page-2 append.
  const requestId = useRef(0);
  const loadedOnce = useRef(false);

  const load = useCallback(async (
    targetPage: number,
    mode: 'replace' | 'append',
    force = false,
  ) => {
    const id = ++requestId.current;
    if (mode === 'append') setAppending(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await cachedRequest(
        cacheKey(targetPage, pageSize),
        () => fetchPage(targetPage, pageSize),
        ttlMs,
        force,
      );
      if (id !== requestId.current) return;

      // A malformed response must surface as a handled error, not an exception thrown
      // mid-render. Without this a server function that resolves to undefined takes the
      // whole page down with an opaque "cannot read properties of undefined".
      if (!data || !Array.isArray(data.items)) {
        throw new Error(
          `Malformed response for "${cacheKey(targetPage, pageSize)}": expected { items, total, totalPages }, received ${
            data === undefined ? 'undefined' : JSON.stringify(data)?.slice(0, 200)
          }`,
        );
      }

      const { items: pageItems, total: pageTotal, totalPages: pageCount, ...rest } = data;
      setItems((current) => (mode === 'append' ? [...current, ...pageItems] : pageItems));
      setTotal(pageTotal ?? 0);
      setTotalPages(pageCount ?? 0);
      setMeta(rest);
      setPage(targetPage);
      loadedOnce.current = true;
    } catch (caught) {
      if (id === requestId.current) setError(caught);
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setAppending(false);
      }
    }
  }, [cacheKey, fetchPage, ttlMs, pageSize]);

  // Any filter change, or a switch between mobile and desktop, starts over at page 1.
  // Deliberately does NOT clear items or reset loadedOnce: the previous results stay on
  // screen under the dimming overlay, so applying a filter never blanks the page back to
  // a skeleton. Only the very first load of the page shows one.
  useEffect(() => {
    load(1, 'replace');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, isDesktop, chosenPageSize]);

  const hasMore = page < totalPages;

  const loadMore = useCallback(() => {
    if (isDesktop || appending || loading || !hasMore) return;
    load(page + 1, 'append');
  }, [isDesktop, appending, loading, hasMore, load, page]);

  const goToPage = useCallback((next: number) => {
    if (next < 1 || next > totalPages || next === page) return;
    load(next, 'replace');
  }, [load, totalPages, page]);

  // On mobile the list is an accumulation of pages, so reloading "the current page"
  // would discard everything above it. Start over from page 1 instead.
  //
  // Forced past the cache. Refresh is only ever called after a mutation or on an explicit
  // retry, and both want the server's answer by definition — without this a payment
  // recorded, or a row restored, appears not to have happened until the TTL lapses.
  const refresh = useCallback(
    () => load(isDesktop ? page : 1, 'replace', true),
    [load, page, isDesktop],
  );

  return {
    isDesktop,
    items,
    total,
    totalPages,
    /** Extra fields returned alongside the page, e.g. statusCounts. */
    meta,
    page,
    pageSize,
    /** First load with nothing on screen — show a skeleton. */
    showSkeleton: loading && !loadedOnce.current,
    /** Refetching with results already visible — dim them, do not blank the page. */
    refreshing: loading && loadedOnce.current,
    /** Fetching the next page for infinite scroll. */
    appending,
    hasMore,
    error,
    /** The failure was a lost connection, not a bad request — show the offline screen. */
    offline: isConnectionError(error),
    /** A real failure that is not a connection drop — worth showing rather than an empty list. */
    failed: Boolean(error) && !isConnectionError(error),
    errorMessage: error instanceof Error ? error.message : error ? String(error) : null,
    loadMore,
    goToPage,
    refresh,
    setPageSize: setChosenPageSize,
  };
}
