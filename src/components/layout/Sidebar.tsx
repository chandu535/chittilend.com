import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { Link, useMatchRoute } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { authStore } from '@/lib/stores';
import { NAV_ITEMS, visibleTo } from './navItems';

export function Sidebar() {
  const { t } = useTranslation();
  const matchRoute = useMatchRoute();
  const user = useStore(authStore, (s) => s.user);

  // Every page is readable by both roles except the admin-flagged ones — staff accounts,
  // the Bin and the analytics view are administration rather than day-to-day work.
  const visibleItems = visibleTo(NAV_ITEMS, user?.role);

  return (
    // Tablet portrait gets a narrow rail with labels under the icons; only lg has
    // room for the full labelled panel.
    <aside className="hidden md:flex md:flex-col md:w-[76px] lg:w-60 shrink-0 bg-white border-r border-slate-200 min-h-0">
      <nav aria-label="Main navigation" className="flex-1 p-2 lg:p-3 space-y-1 overflow-y-auto overscroll-contain">
        {visibleItems.map((item) => {
          const isActive = !!matchRoute({ to: item.to, fuzzy: true });

          return (
            <Link
              key={item.to}
              to={item.to}
              title={t(item.labelKey)}
              className={clsx(
                'flex rounded-lg font-medium transition-colors',
                'flex-col items-center gap-1 px-1 py-2 text-[10px] text-center',
                'lg:flex-row lg:items-center lg:gap-3 lg:px-3 lg:py-2.5 lg:text-sm lg:text-left',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )}
            >
              {item.icon}
              <span className="max-w-full truncate">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
