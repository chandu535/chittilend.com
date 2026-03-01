import { clsx } from 'clsx';
import { STATUS_COLORS } from '@/lib/constants';
import type { ReactNode } from 'react';

type StatusKey = keyof typeof STATUS_COLORS;

interface BadgeProps {
  status: StatusKey;
  children: ReactNode;
  className?: string;
}

export function Badge({ status, children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'badge inline-flex items-center rounded-full px-2.5 py-0.5',
        'text-xs font-medium',
        STATUS_COLORS[status],
        className,
      )}
    >
      {children}
    </span>
  );
}
