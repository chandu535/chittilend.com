import { clsx } from 'clsx';

function Block({ className }: { className?: string }) {
  // Tailwind emits rounded-lg after rounded-full and rounded-2xl, so baking it in
  // unconditionally would silently beat a caller's radius. Only apply the default
  // when the caller has not asked for one.
  const hasRadius = className?.includes('rounded');

  return (
    <div className={clsx('animate-pulse bg-slate-200/80', !hasRadius && 'rounded-lg', className)} />
  );
}

export function PageSkeleton({ variant = 'list' }: { variant?: 'dashboard' | 'list' | 'detail' | 'portal' | 'table' }) {
  if (variant === 'dashboard') {
    return (
      <div className="space-y-5 animate-pulse">
        <Block className="h-8 w-40" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Block key={i} className="h-28" />)}</div>
        <Block className="h-48" />
        <div className="grid gap-3 sm:grid-cols-2"><Block className="h-36" /><Block className="h-36" /></div>
      </div>
    );
  }
  if (variant === 'detail' || variant === 'portal') {
    return (
      <div className="space-y-4 animate-pulse">
        <Block className="h-8 w-48" />
        <Block className="h-28" />
        <div className="grid grid-cols-2 gap-3"><Block className="h-24" /><Block className="h-24" /></div>
        <Block className="h-44" />
        <Block className="h-36" />
      </div>
    );
  }
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between"><Block className="h-8 w-32" /><Block className="h-10 w-28" /></div>
      <Block className="h-11 w-full" />
      <div className={clsx('space-y-3', variant === 'table' && 'hidden lg:block')}>
        {Array.from({ length: 5 }, (_, i) => <Block key={i} className="h-24" />)}
      </div>
      <div className={clsx('space-y-3 lg:hidden', variant !== 'table' && 'hidden')}>
        {Array.from({ length: 4 }, (_, i) => <Block key={i} className="h-28" />)}
      </div>
    </div>
  );
}

export function InlineSkeleton({ className }: { className?: string }) {
  return <Block className={className} />;
}
