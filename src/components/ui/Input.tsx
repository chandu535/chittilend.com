import { clsx } from 'clsx';
import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              'w-full rounded-xl border bg-white px-3.5 py-2.5',
              'text-[15px] text-slate-900 placeholder:text-slate-400',
              'min-h-[48px]',
              'focus:outline-none focus:ring-2 focus:ring-violet-300/60 focus:border-violet-400',
              'transition-all duration-150',
              'shadow-[0_1px_4px_rgba(0,0,0,0.06)]',
              error
                ? 'border-red-300 focus:ring-red-300/60 focus:border-red-400'
                : 'border-slate-200',
              leftIcon && 'pl-10',
              className,
            )}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-sm text-danger">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="mt-1 text-sm text-slate-400">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
