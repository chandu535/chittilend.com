import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { Link, useMatchRoute } from '@tanstack/react-router';
import { BOTTOM_NAV_ITEMS, NEW_LOAN_ITEM } from './navItems';

/**
 * The phone's bottom bar.
 *
 * Rendered from BOTTOM_NAV_ITEMS rather than a list of its own. It used to hold its own
 * copy of five destinations, which meant the paths in navItems.tsx only governed what fell
 * *out* of the bar and into the profile menu — never what appeared in it. Adding a page
 * there moved the page it replaced into the overflow menu and left the new one with no way
 * in at all, and the same page showed in both places. One list now, so that cannot recur.
 */
export function BottomNav() {
  const { t } = useTranslation();
  const matchRoute = useMatchRoute();

  return (
    <nav aria-label="Main navigation" className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-slate-200 md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive = !!matchRoute({ to: item.to, fuzzy: true });
          const isNew = item.to === NEW_LOAN_ITEM.to;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={clsx(
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full',
                'text-xs transition-colors min-w-0',
                // The icons are declared at sidebar size; the bar wants them a step larger.
                '[&_svg]:h-6 [&_svg]:w-6',
                isNew
                  ? 'text-brand'
                  : isActive
                    ? 'text-brand'
                    : 'text-slate-400 hover:text-slate-600',
              )}
            >
              {isNew ? (
                /* The one gold object on most screens. New Loan is the thing this app
                   exists to do, it sits dead centre, and gold is the only colour here
                   that pulls the eye without shouting — so it is spent once, here. */
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gold text-on-gold -mt-4 shadow-md ring-4 ring-card [&_svg]:h-6 [&_svg]:w-6">
                  {item.icon}
                </div>
              ) : (
                item.icon
              )}
              <span className={clsx(
                'truncate max-w-full px-1 nav-label',
                isNew && 'text-brand',
              )}>
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
