import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Spinner } from './Spinner';

interface InfiniteScrollProps {
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
  /** How far below the fold to start fetching. Larger feels smoother, costs a request. */
  rootMargin?: string;
}

/**
 * Sentinel that requests the next page before the user reaches the bottom, so the list
 * usually extends without them ever seeing a spinner. Uses IntersectionObserver rather
 * than scroll events — no per-frame work, so it cannot cause scroll jank.
 */
export function InfiniteScroll({
  onLoadMore,
  hasMore,
  loading,
  rootMargin = '600px',
}: InfiniteScrollProps) {
  const { t } = useTranslation();
  const sentinelRef = useRef<HTMLDivElement>(null);
  // Read the latest callback without re-creating the observer on every render.
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onLoadMoreRef.current();
      },
      { rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, rootMargin, loading]);

  if (!hasMore && !loading) return null;

  return (
    <div ref={sentinelRef} className="flex flex-col items-center justify-center gap-2 py-6">
      {loading && (
        <>
          <Spinner size="md" />
          <span className="text-xs text-slate-400">{t('common.loadingMore')}</span>
        </>
      )}
    </div>
  );
}

/** Shown once every page has been loaded. */
export function EndOfList({ count }: { count: number }) {
  const { t } = useTranslation();

  return (
    <p className="py-6 text-center text-xs text-slate-400">
      {t('common.endOfList', { count })}
    </p>
  );
}
