import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';

interface OfflineScreenProps {
  onRetry: () => void;
}

/** Live network status. Starts optimistic so SSR and hydration agree. */
export function useIsOnline(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return online;
}

export function OfflineScreen({ onRetry }: OfflineScreenProps) {
  const { t } = useTranslation();
  const online = useIsOnline();
  const [retrying, setRetrying] = useState(false);

  // The moment the device reports a connection again, recover without a tap.
  useEffect(() => {
    if (online) return;
    const onBackOnline = () => onRetry();
    window.addEventListener('online', onBackOnline);
    return () => window.removeEventListener('online', onBackOnline);
  }, [online, onRetry]);

  const handleRetry = () => {
    setRetrying(true);
    onRetry();
    // Purely so the button acknowledges the tap; the parent decides what happens next.
    setTimeout(() => setRetrying(false), 1200);
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
        <svg
          className="h-10 w-10 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 16.5a5 5 0 017 0" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12.9a10 10 0 015.2-2.7M18.9 12.8a10 10 0 00-4-2.5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M1.4 8.6a15 15 0 015.6-3.4M22.6 8.5a15 15 0 00-9.7-3.4" />
          <circle cx="12" cy="20" r="0.75" fill="currentColor" />
        </svg>
      </div>

      <h2 className="text-xl font-semibold text-slate-900">
        {online ? t('errors.connectionTitle') : t('errors.offlineTitle')}
      </h2>
      <p className="mt-2 max-w-xs text-sm text-slate-500">
        {online ? t('errors.connectionBody') : t('errors.offlineBody')}
      </p>

      <Button className="mt-6 min-w-40" onClick={handleRetry} loading={retrying} disabled={retrying}>
        {t('errors.retry')}
      </Button>

      {!online && (
        <p className="mt-3 text-xs text-slate-400">{t('errors.offlineAuto')}</p>
      )}
    </div>
  );
}
