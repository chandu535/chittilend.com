import { useCallback, useEffect, useRef, useState } from 'react';

/** Matches the exit durations in styles.css. */
const EXIT_MS = 200;
const EXIT_MS_REDUCED = 120;

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Lets a panel animate out before it is unmounted.
 *
 * These panels are rendered conditionally by their parent — `{selected && <Modal/>}` —
 * so calling onClose removes them from the tree in the same frame and there is nothing
 * left to animate. Every dismissal therefore had a smooth open and an instant, jarring
 * close.
 *
 * `requestClose` marks the panel as closing, which triggers the exit animation, and only
 * calls the real onClose once it has finished. Call sites keep passing the same onClose;
 * only the dismiss handlers inside the panel change.
 *
 * Returns `closing` for the `data-closing` attribute the CSS keys off.
 */
export function useSheetTransition(onClose: () => void) {
  const [closing, setClosing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const requestClose = useCallback(() => {
    // Guarded so a second tap during the exit does not queue a second close.
    if (timer.current) return;
    setClosing(true);
    timer.current = setTimeout(onClose, prefersReducedMotion() ? EXIT_MS_REDUCED : EXIT_MS);
  }, [onClose]);

  return { closing, requestClose };
}

/**
 * The same idea for a panel whose open state lives in the component itself rather than
 * in its parent, and which only animates out on one breakpoint.
 *
 * `skip` short-circuits the wait — the desktop popover has no exit animation, so making
 * it linger for 200ms would just feel slow.
 */
export function useSheetExit(hide: () => void, skip: boolean) {
  const [closing, setClosing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const requestClose = useCallback(() => {
    if (skip || prefersReducedMotion()) { hide(); return; }
    if (timer.current) return;
    setClosing(true);
    timer.current = setTimeout(() => { timer.current = null; hide(); }, EXIT_MS);
  }, [skip, hide]);

  return { closing, requestClose, setClosing };
}
