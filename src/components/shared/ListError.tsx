import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';

/**
 * A list that failed to load for a reason other than a lost connection. Shows the actual
 * message rather than an empty state, so a broken response is never mistaken for
 * "you have no records".
 */
export function ListError({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <svg className="mb-4 h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
      <h3 className="text-base font-semibold text-slate-700">{t('errors.loadFailed')}</h3>
      {message && (
        <p className="mt-1 max-w-md break-words text-xs text-slate-400">{message}</p>
      )}
      <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
        {t('errors.retry')}
      </Button>
    </div>
  );
}
