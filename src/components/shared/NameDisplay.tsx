import { useStore } from '@tanstack/react-store';
import { uiStore } from '@/lib/stores';
import { toTelugu } from '@/lib/transliterate';

interface NameDisplayProps {
  name: string;
  /** Human-confirmed Telugu spelling. Falls back to transliteration when absent. */
  nameTelugu?: string | null;
  className?: string;
}

function localize(name: string, nameTelugu: string | null | undefined, language: string): string {
  if (language !== 'te') return name;
  return nameTelugu || toTelugu(name);
}

export function NameDisplay({ name, nameTelugu, className }: NameDisplayProps) {
  const language = useStore(uiStore, (s) => s.language);

  return <span className={className}>{localize(name, nameTelugu, language)}</span>;
}

/** Hook for getting the localized name string directly */
export function useLocalizedName(name: string, nameTelugu?: string | null): string {
  const language = useStore(uiStore, (s) => s.language);
  return localize(name, nameTelugu, language);
}
