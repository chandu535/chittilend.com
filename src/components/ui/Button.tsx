import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'gold' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

/**
 * Flat fills, no gradients.
 *
 * The old primary was a pink-to-rose gradient with a coloured glow under it. A gradient
 * says "look at me" without saying what for, and once every primary button on every screen
 * has one, the emphasis is spent everywhere and lands nowhere. A single solid aubergine
 * reads as the same control each time — which is what lets `gold` mean something on the
 * rare screen that uses it.
 */
const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-on-primary hover:bg-primary-hover shadow-sm active:scale-[0.98] '
    + 'focus-visible:ring-brand/40',

  /*
    At most one per screen. Gold is the only thing in this palette that stops the eye, so it
    belongs on the action someone opened the screen to take. It is also the pairing that
    carries the brand — gold can only ever appear beneath aubergine text, never as text
    itself — so spending it twice on one screen turns the signature into furniture.
  */
  gold:
    'bg-gold text-on-gold hover:bg-gold-hover shadow-sm active:scale-[0.98] '
    + 'focus-visible:ring-brand/40',

  secondary:
    'bg-card text-brand border border-slate-200 hover:bg-slate-50 hover:border-slate-300 '
    + 'focus-visible:ring-brand/30',

  danger:
    'bg-danger text-on-status hover:opacity-90 shadow-sm active:scale-[0.98] '
    + 'focus-visible:ring-danger/40',

  ghost:
    'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-800 '
    + 'focus-visible:ring-slate-300',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-1.5 text-[13px] min-h-[36px]',
  md: 'px-5 py-2.5 text-[14px] min-h-[44px]',
  lg: 'px-6 py-3 text-[15px] min-h-[48px]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold',
        'transition-colors duration-150 focus:outline-none focus-visible:ring-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="h-4 w-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
