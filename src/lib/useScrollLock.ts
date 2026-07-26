import { useEffect } from 'react';
import { APP_SCROLL_ID } from './constants';

/**
 * Freezes the content behind an overlay. Locks both the document and the shell's
 * scroll container, because which of the two actually scrolls depends on the breakpoint.
 * Saving the previous values keeps nested overlays from unlocking their parent.
 */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const scroller = document.getElementById(APP_SCROLL_ID);
    const previousBody = document.body.style.overflow;
    const previousScroller = scroller?.style.overflow ?? '';

    document.body.style.overflow = 'hidden';
    if (scroller) scroller.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBody;
      if (scroller) scroller.style.overflow = previousScroller;
    };
  }, [active]);
}
