import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import te from './te.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    te: { translation: te },
  },
  lng:
    (typeof window !== 'undefined' && localStorage.getItem('chittilend-lang')) ||
    (typeof navigator !== 'undefined' && navigator.language.startsWith('te')
      ? 'te'
      : 'en') ||
    'en',
  fallbackLng: 'en',
  supportedLngs: ['en', 'te'],

  interpolation: {
    escapeValue: false,

    format: (value: unknown, format: string | undefined, lng: string | undefined) => {
      if (typeof value !== 'number') return String(value);

      const locale = lng === 'te' ? 'te-IN' : 'en-IN';
      const ns = lng === 'te' ? 'telu' : 'latn';

      if (format === 'number') {
        return new Intl.NumberFormat(locale, { numberingSystem: ns }).format(value);
      }

      if (format === 'currency') {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: 'INR',
          numberingSystem: ns,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      }

      if (format === 'percent') {
        return new Intl.NumberFormat(locale, {
          style: 'percent',
          numberingSystem: ns,
          minimumFractionDigits: 0,
          maximumFractionDigits: 1,
        }).format(value / 100);
      }

      return new Intl.NumberFormat(locale, { numberingSystem: ns }).format(value);
    },
  },

  react: {
    useSuspense: true,
  },
});

export default i18n;
