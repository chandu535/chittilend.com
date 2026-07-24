import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:   'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-[0_2px_12px_rgba(236,72,153,0.35)] hover:shadow-[0_4px_16px_rgba(236,72,153,0.45)] hover:opacity-95 focus:ring-pink-300 active:scale-[0.98]',
  secondary: 'bg-white text-violet-700 border border-violet-200 hover:bg-violet-50 focus:ring-violet-200 shadow-sm',
  danger:    'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-[0_2px_8px_rgba(220,38,38,0.3)] hover:opacity-95 focus:ring-red-300 active:scale-[0.98]',
  ghost:     'bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-200',
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
        'transition-all duration-150 focus:outline-none focus:ring-2',
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
