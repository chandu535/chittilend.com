import { clsx } from 'clsx';
import { useStore } from '@tanstack/react-store';
import { useTranslation } from 'react-i18next';
import { themeStore, setTheme, type ThemeChoice } from '@/lib/theme';

const SunIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1.5m0 15V21m9-9h-1.5m-15 0H3m15.364-6.364l-1.06 1.06M6.696 17.304l-1.06 1.06m12.728 0l-1.06-1.06M6.696 6.696l-1.06-1.06M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
  </svg>
);

/** Half-filled disc — the conventional mark for "whatever the device says". */
const AutoIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <circle cx="12" cy="12" r="8.25" />
    <path fill="currentColor" stroke="none" d="M12 3.75a8.25 8.25 0 000 16.5V3.75z" />
  </svg>
);

const MoonIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
  </svg>
);

const OPTIONS: { value: ThemeChoice; icon: () => React.ReactElement; labelKey: string }[] = [
  { value: 'light', icon: SunIcon, labelKey: 'theme.light' },
  { value: 'system', icon: AutoIcon, labelKey: 'theme.auto' },
  { value: 'dark', icon: MoonIcon, labelKey: 'theme.dark' },
];

/**
 * Light, auto, dark — all three visible at once.
 *
 * A single sun/moon button that cycles is smaller, but it can only ever show one state, so
 * "auto" becomes invisible and there is no way to tell whether the app is dark because it
 * was asked to be or because the phone is. Three segments say which one is in force.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useTranslation();
  const choice = useStore(themeStore, (s) => s.choice);

  return (
    <div
      role="radiogroup"
      aria-label={t('theme.label')}
      className={clsx('flex items-center gap-0.5 rounded-lg bg-slate-100 p-0.5', className)}
    >
      {OPTIONS.map(({ value, icon: Icon, labelKey }) => {
        const active = choice === value;

        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            title={t(labelKey)}
            onClick={() => setTheme(value)}
            className={clsx(
              'flex h-8 flex-1 items-center justify-center rounded-md transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
              active
                ? 'bg-card text-brand shadow-sm'
                : 'text-slate-400 hover:text-slate-600',
            )}
          >
            <Icon />
            <span className="sr-only">{t(labelKey)}</span>
          </button>
        );
      })}
    </div>
  );
}
