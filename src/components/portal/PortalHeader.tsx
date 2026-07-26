import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '@/components/shared/LanguageToggle';

export function PortalHeader() {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        <h1 className="text-lg font-bold text-primary">{t('common.appName')}</h1>
        <LanguageToggle />
      </div>
    </header>
  );
}
