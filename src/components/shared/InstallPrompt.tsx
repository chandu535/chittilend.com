import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Registers the service worker and offers an install button when Chrome says the app
 * qualifies.
 *
 * Android hides "Install app" in the browser menu, which nobody finds. Chrome fires
 * `beforeinstallprompt` when the app is installable, so the button only appears when
 * tapping it will actually work — and never once the app is already installed.
 */
export function InstallPrompt() {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // An app that cannot register a worker still works; it just is not installable.
      });
    }

    setDismissed(localStorage.getItem('install-dismissed') === '1');

    const onPrompt = (e: Event) => {
      // Chrome shows its own mini-infobar unless the event is cancelled.
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setPrompt(null);

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!prompt || dismissed) return null;

  const install = async () => {
    await prompt.prompt();
    await prompt.userChoice;
    setPrompt(null);
  };

  const dismiss = () => {
    localStorage.setItem('install-dismissed', '1');
    setDismissed(true);
  };

  return (
    <div
      className="fixed inset-x-3 z-40 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg md:left-auto md:right-4 md:w-80"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 4.5rem)' }}
      role="dialog"
      aria-label={t('install.title')}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-lg font-bold text-white">
        S
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">{t('install.title')}</p>
        <p className="truncate text-xs text-slate-500">{t('install.subtitle')}</p>
      </div>
      <button
        type="button"
        onClick={install}
        className="min-h-9 shrink-0 rounded-lg bg-primary px-3 text-sm font-semibold text-white"
      >
        {t('install.action')}
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t('common.cancel')}
        className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
