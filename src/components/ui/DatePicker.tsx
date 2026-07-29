import { clsx } from 'clsx';
import { forwardRef, type InputHTMLAttributes } from 'react';

interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, error, className, id, ...props }, ref) => {
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
        <input
          ref={ref}
          id={inputId}
          type="date"
          className={clsx(
            'w-full rounded-lg border bg-card px-3 py-2.5',
            'text-base text-slate-900',
            'min-h-[48px]',
            'focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand',
            'transition-colors',
            error
              ? 'border-danger focus:ring-danger/30 focus:border-danger'
              : 'border-slate-300',
            className,
          )}
          aria-invalid={error ? 'true' : undefined}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-danger">{error}</p>
        )}
      </div>
    );
  },
);

DatePicker.displayName = 'DatePicker';
