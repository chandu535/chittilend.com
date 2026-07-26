import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { Spinner } from '@/components/ui/Spinner';

/**
 * Dims one region while its data refreshes, keeping the existing content in place.
 * Scoped deliberately: only the cards whose data actually changed should react, so the
 * rest of the page never flickers.
 */
export function BusyOverlay({ busy, children }: { busy: boolean; children: ReactNode }) {
  return (
    <div className="relative h-full">
      {busy && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/60 backdrop-blur-[1px]">
          <Spinner size="md" />
        </div>
      )}
      <div
        className={clsx('h-full transition-opacity duration-150', busy && 'opacity-40')}
        aria-busy={busy}
      >
        {children}
      </div>
    </div>
  );
}
