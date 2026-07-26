import { useStore } from '@tanstack/react-store';
import { uiStore } from '@/lib/stores';
import { formatINR } from '@/lib/formatters';

interface CurrencyDisplayProps {
  amount: number;
  className?: string;
}

export function CurrencyDisplay({ amount, className }: CurrencyDisplayProps) {
  const language = useStore(uiStore, (s) => s.language);

  return (
    <span className={className}>
      {formatINR(amount, { lang: language })}
    </span>
  );
}
