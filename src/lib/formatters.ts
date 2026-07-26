type Lang = 'en' | 'te';

interface FormatOptions {
  lang: Lang;
  useNativeNumerals?: boolean;
}

// ============================================================
// NUMBER FORMATTING (always Latin numerals)
// ============================================================

export function formatNumber(
  amount: number | string,
  { lang }: FormatOptions,
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '—';

  const locale = lang === 'te' ? 'te-IN' : 'en-IN';
  return new Intl.NumberFormat(locale, { numberingSystem: 'latn' }).format(num);
}

export function formatINR(
  amount: number | string,
  { lang }: FormatOptions,
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹—';

  const locale = lang === 'te' ? 'te-IN' : 'en-IN';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'INR',
    numberingSystem: 'latn',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatINRDecimal(
  amount: number | string,
  { lang }: FormatOptions,
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹—';

  const locale = lang === 'te' ? 'te-IN' : 'en-IN';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'INR',
    numberingSystem: 'latn',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatINRCompact(
  amount: number | string,
  { lang }: FormatOptions,
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹—';

  const denominations = {
    en: {
      crore: { threshold: 10000000, singular: 'Crore', plural: 'Crores' },
      lakh: { threshold: 100000, singular: 'Lakh', plural: 'Lakhs' },
      thousand: { threshold: 1000, singular: 'K', plural: 'K' },
    },
    te: {
      crore: { threshold: 10000000, singular: 'కోటి', plural: 'కోట్లు' },
      lakh: { threshold: 100000, singular: 'లక్ష', plural: 'లక్షలు' },
      thousand: { threshold: 1000, singular: 'వేలు', plural: 'వేలు' },
    },
  };

  const d = denominations[lang];
  let value: number;
  let label: string;

  if (num >= d.crore.threshold) {
    value = num / d.crore.threshold;
    label = value === 1 ? d.crore.singular : d.crore.plural;
  } else if (num >= d.lakh.threshold) {
    value = num / d.lakh.threshold;
    label = value === 1 ? d.lakh.singular : d.lakh.plural;
  } else if (num >= d.thousand.threshold) {
    value = num / d.thousand.threshold;
    label = value === 1 ? d.thousand.singular : d.thousand.plural;
  } else {
    return formatINR(num, { lang });
  }

  const formattedValue = formatNumber(
    Math.round(value * 10) / 10,
    { lang },
  );

  return `₹${formattedValue} ${label}`;
}

// ============================================================
// DATE FORMATTING (Telugu text for months, Latin numerals for digits)
// ============================================================

export function formatDate(
  date: string | Date,
  { lang }: FormatOptions,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const locale = lang === 'te' ? 'te-IN' : 'en-IN';

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
    numberingSystem: 'latn',
  }).format(d);
}

export function formatDateLong(
  date: string | Date,
  { lang }: FormatOptions,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const locale = lang === 'te' ? 'te-IN' : 'en-IN';

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
    numberingSystem: 'latn',
  }).format(d);
}

export function formatMonthYear(
  date: string | Date,
  { lang }: FormatOptions,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const locale = lang === 'te' ? 'te-IN' : 'en-IN';

  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
    numberingSystem: 'latn',
  }).format(d);
}

export function formatRelativeTime(
  date: string | Date,
  { lang }: FormatOptions,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  const locale = lang === 'te' ? 'te-IN' : 'en-IN';
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (Math.abs(diffDays) >= 30) {
    const diffMonths = Math.round(diffDays / 30);
    return rtf.format(diffMonths, 'month');
  } else if (Math.abs(diffDays) >= 1) {
    return rtf.format(diffDays, 'day');
  } else if (Math.abs(diffHours) >= 1) {
    return rtf.format(diffHours, 'hour');
  } else {
    return rtf.format(diffMinutes, 'minute');
  }
}

// ============================================================
// PHONE FORMATTING (always Latin digits)
// ============================================================

export function formatPhone(mobile: string): string {
  return mobile.replace(/(\d{5})(\d{5})/, '$1 $2');
}

// ============================================================
// PERCENTAGE FORMATTING
// ============================================================

export function formatPercent(
  value: number,
  { lang }: FormatOptions,
): string {
  const locale = lang === 'te' ? 'te-IN' : 'en-IN';

  return new Intl.NumberFormat(locale, {
    style: 'percent',
    numberingSystem: 'latn',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value / 100);
}
