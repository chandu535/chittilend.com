import { useStore } from '@tanstack/react-store';
import { useTranslation } from 'react-i18next';
import { uiStore, setLanguage } from '@/lib/stores';

export function LanguageToggle() {
  const language = useStore(uiStore, (s) => s.language);
  const { i18n } = useTranslation();

  const toggle = () => {
    const newLang = language === 'en' ? 'te' : 'en';
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors min-h-[44px]"
      aria-label={language === 'en' ? 'Switch to Telugu' : 'Switch to English'}
    >
      <span className={language === 'en' ? 'font-bold text-brand' : 'text-slate-400'}>EN</span>
      <span className="text-slate-400">/</span>
      <span className={language === 'te' ? 'font-bold text-brand' : 'text-slate-400'}>తె</span>
    </button>
  );
}
