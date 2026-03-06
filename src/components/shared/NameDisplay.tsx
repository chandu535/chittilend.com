import { useStore } from '@tanstack/react-store';
import { uiStore } from '@/lib/stores';
import { toTelugu } from '@/lib/transliterate';

interface NameDisplayProps {
  name: string;
  className?: string;
}

export function NameDisplay({ name, className }: NameDisplayProps) {
  const language = useStore(uiStore, (s) => s.language);
  const displayName = language === 'te' ? toTelugu(name) : name;

  return <span className={className}>{displayName}</span>;
}

/** Hook for getting the localized name string directly */
export function useLocalizedName(name: string): string {
  const language = useStore(uiStore, (s) => s.language);
  return language === 'te' ? toTelugu(name) : name;
}
