import { useStore } from '@tanstack/react-store';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { authStore, setAuthUser } from '@/lib/stores';
import { useLocalizedName } from '@/components/shared/NameDisplay';
import { LanguageToggle } from '@/components/shared/LanguageToggle';
import { logout } from '@/server/functions/auth';
import { useState, useRef, useEffect } from 'react';

export function Header() {
  const { t } = useTranslation();
  const user = useStore(authStore, (s) => s.user);
  const displayName = useLocalizedName(user?.name || '');
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const handleLogout = async () => {
    await logout();
    setAuthUser(null);
    navigate({ to: '/login' });
  };

  return (
    <header className="sticky top-0 z-40 shrink-0 bg-white border-b border-slate-200">
      <div className="flex h-14 items-center justify-between gap-3 px-4">
        <h1 className="truncate text-lg font-bold text-primary">
          {t('common.appName')}
        </h1>

        <div className="flex shrink-0 items-center gap-2">
          <LanguageToggle />

          {user && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors min-h-[44px]"
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden max-w-32 truncate sm:inline">{displayName}</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-1 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-sm font-medium text-slate-900">{displayName}</p>
                    <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm text-danger hover:bg-slate-50 transition-colors min-h-[44px] flex items-center"
                  >
                    {t('nav.logout')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
