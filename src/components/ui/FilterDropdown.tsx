import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { useIsDesktop } from '@/lib/useMediaQuery';
import { useScrollLock } from '@/lib/useScrollLock';

interface FilterDropdownProps {
  /** Short label shown when nothing is chosen, e.g. "Status". */
  label: string;
  /** The current choice, shown in place of the label once something is selected. */
  value?: string | null;
  /** Count badge on the trigger — the size of the current selection. */
  count?: number;
  icon?: ReactNode;
  /** Clears the selection. Omit when the filter always has a value. */
  onClear?: () => void;
  clearLabel?: string;
  /** Rendered inside the panel; call `close` when a choice is made. */
  children: (close: () => void) => ReactNode;
  className?: string;
  /** Panel width on desktop. Mobile always uses the full sheet. */
  panelWidth?: number;
}

/**
 * A filter control that opens as a popover on desktop and a bottom sheet on mobile.
 *
 * Chips do not survive contact with a real filter set: six of them wrapped onto a second
 * row on desktop and scrolled off the right edge on mobile, so "Extended" and "Completed"
 * were invisible until you went looking. One trigger showing the current choice costs a
 * fixed amount of space no matter how many options exist.
 *
 * The panel is portalled to the body — the toolbar sits inside a pinned header, which
 * would otherwise clip it — and on mobile it comes up from the bottom where a thumb is,
 * with room for rows carrying a photo and a phone number.
 */
export function FilterDropdown({
  label, value, count, icon, onClear, clearLabel, children, className, panelWidth = 300,
}: FilterDropdownProps) {
  const isDesktop = useIsDesktop();
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useScrollLock(open && !isDesktop);

  const close = useCallback(() => setOpen(false), []);
  const reposition = useCallback(() => {
    if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect());
  }, []);

  useEffect(() => {
    if (!open || !isDesktop) return;
    reposition();
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open, isDesktop, reposition]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { close(); triggerRef.current?.focus(); }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  const selected = Boolean(value);

  return (
    <>
      <div className={clsx('flex min-w-0 items-center', className)}>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => (open ? close() : setOpen(true))}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={clsx(
            'inline-flex min-h-10 min-w-0 flex-1 items-center gap-2 border px-3 py-2 text-sm font-medium transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
            selected && onClear ? 'rounded-l-xl border-r-0' : 'rounded-xl',
            selected
              ? 'border-primary bg-primary text-white'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
          )}
        >
          {icon && <span className="shrink-0">{icon}</span>}
          <span className="truncate">{value || label}</span>
          {count !== undefined && (
            <span className={clsx(
              'shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
              selected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500',
            )}>
              {count}
            </span>
          )}
          <svg className={clsx('h-3.5 w-3.5 shrink-0 transition-transform', open && 'rotate-180', selected ? 'opacity-70' : 'opacity-50')}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Clearing is its own control so it cannot reopen the panel by accident. */}
        {selected && onClear && (
          <button
            type="button"
            onClick={() => { onClear(); close(); }}
            aria-label={clearLabel ?? 'Clear'}
            className="inline-flex min-h-10 shrink-0 items-center rounded-r-xl border border-primary bg-primary pl-1 pr-2.5 text-white/80 transition-colors hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {open && isDesktop && rect && createPortal(
        <div
          ref={panelRef}
          className="fixed z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
          style={{
            top: Math.min(rect.bottom + 8, window.innerHeight - 260),
            left: Math.max(12, Math.min(rect.left, window.innerWidth - panelWidth - 12)),
            width: panelWidth,
          }}
        >
          {children(close)}
        </div>,
        document.body,
      )}

      {open && !isDesktop && createPortal(
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={close} aria-hidden />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className="relative max-h-[80dvh] overflow-hidden rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h2 className="text-base font-semibold text-slate-900">{label}</h2>
              <button
                type="button"
                onClick={close}
                aria-label={clearLabel ?? 'Close'}
                className="-mr-1 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {children(close)}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

/** A single choice inside a FilterDropdown panel. */
export function FilterOption({ label, count, selected, onSelect, children }: {
  label?: string;
  count?: number;
  selected: boolean;
  onSelect: () => void;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={clsx(
        'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
        selected ? 'bg-primary/5' : 'hover:bg-slate-50',
      )}
    >
      {children ?? <span className="flex-1 text-sm font-medium text-slate-900">{label}</span>}
      {count !== undefined && (
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-slate-500">
          {count}
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
