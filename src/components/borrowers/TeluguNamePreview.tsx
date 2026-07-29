import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { suggestTelugu } from '@/server/functions/transliteration';
import { hasTeluguScript, hasLatinScript } from '@/lib/transliterate';

interface TeluguNamePreviewProps {
  /** The name as typed in the name field. */
  name: string;
  value: string;
  onChange: (nameTelugu: string) => void;
}

const DEBOUNCE_MS = 400;

/**
 * Shows the Telugu spelling of a Latin-typed name beneath the name field.
 * Stays silent when the name is already Telugu — there is nothing to convert.
 * The suggestion is editable because the engine is a guess and the operator knows
 * how the borrower actually spells their name.
 */
export function TeluguNamePreview({ name, value, onChange }: TeluguNamePreviewProps) {
  const { t } = useTranslation();
  const [alternates, setAlternates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  // Tracks the name that produced the current suggestion, so a user's manual
  // correction is not overwritten until they actually change the name again.
  const suggestedFor = useRef<string | null>(null);
  // Callers pass an inline setter, so keep it out of the effect's dependencies.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const trimmed = name.trim();
  const alreadyTelugu = hasTeluguScript(trimmed);
  const convertible = trimmed.length >= 2 && hasLatinScript(trimmed) && !alreadyTelugu;

  useEffect(() => {
    if (!convertible) {
      setAlternates([]);
      suggestedFor.current = null;
      return;
    }
    if (suggestedFor.current === trimmed) return;

    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const result = await suggestTelugu({ data: { text: trimmed } });
        if (cancelled) return;
        suggestedFor.current = trimmed;
        setAlternates(result.suggestions);
        onChangeRef.current(result.suggestions[0] ?? '');
      } catch {
        if (!cancelled) setAlternates([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      setLoading(false);
    };
  }, [trimmed, convertible]);

  if (alreadyTelugu || !convertible) return null;

  return (
    <div className="-mt-2 pl-0.5">
      {loading && !value ? (
        <p className="text-xs text-slate-400">{t('borrowers.teluguConverting')}</p>
      ) : value ? (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-xs text-slate-400 shrink-0">{t('borrowers.teluguName')}</span>

          {editing ? (
            <input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onBlur={() => setEditing(false)}
              autoFocus
              lang="te"
              className="flex-1 min-w-[8rem] rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              lang="te"
              className="text-sm font-medium text-slate-600 hover:text-brand underline decoration-dotted underline-offset-4"
              title={t('borrowers.teluguEdit')}
            >
              {value}
            </button>
          )}

          {alternates.length > 1 && !editing && (
            <span className="flex flex-wrap items-center gap-1">
              {alternates.slice(1).map((option) => (
                <button
                  key={option}
                  type="button"
                  lang="te"
                  onClick={() => onChange(option)}
                  className={clsx(
                    'rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs',
                    'text-slate-500 hover:border-brand/30 hover:text-brand transition-colors',
                  )}
                >
                  {option}
                </button>
              ))}
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}
