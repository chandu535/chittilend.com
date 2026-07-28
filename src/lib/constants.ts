// The shell's scroll container at md+. Below md the document scrolls instead.
export const APP_SCROLL_ID = 'app-scroll';

export const DEFAULTS = {
  TENURE_MONTHS: 5,
  SERVICE_CHARGE_PERCENT: 1,
  MARKUP_PERCENT: 25,
  PAYMENT_FREQUENCY: 'monthly' as const,
  JWT_EXPIRY: '7d',
  PORTAL_TOKEN_LENGTH: 32, // 32 bytes = 64 hex chars
  ITEMS_PER_PAGE: 10,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
} as const;

export const LIMITS = {
  MIN_LOAN_AMOUNT: 1000,
  MAX_LOAN_AMOUNT: 10_000_000, // 1 crore
  MIN_TENURE: 1,
  MAX_TENURE: 60,
  MOBILE_LENGTH: 10,
  MAX_NOTE_LENGTH: 2000,
} as const;

export const STATUS_COLORS = {
  active:    'bg-violet-50 text-violet-700',
  completed: 'bg-emerald-50 text-emerald-700',
  defaulted: 'bg-red-50 text-red-600',
  extended:  'bg-amber-50 text-amber-700',
  paid:      'bg-emerald-50 text-emerald-700',
  pending:   'bg-slate-100 text-slate-600',
  partial:   'bg-amber-50 text-amber-700',
  overdue:   'bg-red-50 text-red-600',
  waived:    'bg-purple-50 text-purple-700',
  // Not a loan or payment status — worn by a row in the Bin. Deliberately the quietest
  // colour here: something removed should not shout louder than a live debt.
  deleted:   'bg-slate-100 text-slate-500',
} as const;
