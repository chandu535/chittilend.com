import type { ReactNode } from 'react';
import { clsx } from 'clsx';

const GUTTER = 'px-4 md:px-6 lg:px-8';
const WIDTH = 'mx-auto w-full max-w-6xl';

/**
 * Default page shape: the whole page scrolls inside the shell.
 * Use for detail screens and forms, where a pinned header would only cost space.
 */
export function ScrollPage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="h-full overflow-y-auto overscroll-contain">
      <div className={clsx(WIDTH, GUTTER, 'py-4 pb-24 md:pb-8', className)}>
        {children}
      </div>
    </div>
  );
}

interface ListPageProps {
  /** Title row, search and filters. Pinned — never scrolls away. */
  header: ReactNode;
  /** Pagination. Pinned to the bottom edge. Omit when there is nothing to show. */
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * Three zones in a fixed viewport height: pinned header, scrolling content, pinned
 * footer. Only the middle scrolls, so the page itself never overflows and the filters
 * and pager stay reachable however long the list gets.
 */
export function ListPage({ header, footer, children }: ListPageProps) {
  return (
    <div className="flex h-full flex-col">
      <div className={clsx('shrink-0 border-b border-slate-100 bg-slate-50', GUTTER)}>
        <div className={clsx(WIDTH, 'space-y-3 py-3')}>{header}</div>
      </div>

      {/* The only scrolling region on the page. */}
      <div className={clsx('min-h-0 flex-1 overflow-y-auto overscroll-contain list-container', GUTTER)}>
        <div className={clsx(WIDTH, 'py-4')}>{children}</div>
      </div>

      {footer && (
        <div className={clsx('shrink-0 border-t border-slate-100 bg-card', GUTTER)}>
          <div className={clsx(WIDTH, 'py-2.5')}>{footer}</div>
        </div>
      )}
    </div>
  );
}
