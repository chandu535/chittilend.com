import { useStore } from '@tanstack/react-store';
import { uiStore } from '@/lib/stores';
import { formatDate } from '@/lib/formatters';

interface DateDisplayProps {
  date: string | Date;
  className?: string;
}

export function DateDisplay({ date, className }: DateDisplayProps) {
  const language = useStore(uiStore, (s) => s.language);
  const useNativeNumerals = useStore(uiStore, (s) => s.useNativeNumerals);

  return (
    <span className={className}>
      {formatDate(date, { lang: language, useNativeNumerals })}
    </span>
  );
}
