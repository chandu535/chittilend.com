import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { useSpeechRecognition } from '@/lib/useSpeechRecognition';
import { useScrollLock } from '@/lib/useScrollLock';

interface VoiceInputProps {
  /** Called with the reading the user picked. */
  onResult: (text: string) => void;
  /** Shown above the microphone, e.g. "Say the borrower's name". */
  prompt?: string;
  className?: string;
  /** Compact button, for sitting inside a search field. */
  size?: 'sm' | 'md';
}

const MicIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m0 0h3.75m-3.75 0H8.25M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
  </svg>
);

/**
 * Speak a name instead of typing it.
 *
 * Borrowers here read Telugu but frequently do not type it, and typing Telugu on a phone
 * keyboard is slow even for those who can. Recognition runs in Telugu directly, so what
 * comes back needs no transliteration and cannot be mangled by it.
 *
 * The engine returns several readings rather than one, and they are all offered. A spoken
 * name has more than one plausible spelling and only the person holding the phone knows
 * which is right — picking silently would quietly file people under the wrong name.
 *
 * Renders nothing where dictation is unavailable, rather than a button that cannot work.
 */
export function VoiceInput({ onResult, prompt, className, size = 'md' }: VoiceInputProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { listening, interim, alternatives, error, start, stop, reset, supported } = useSpeechRecognition();

  useScrollLock(open);

  // Listening begins with the dialog: the point of pressing the button is to speak.
  useEffect(() => {
    if (open) start();
    else reset();
    // `start` and `reset` are stable, and re-running this on every render would restart
    // the microphone continuously.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!supported) return null;

  const close = () => setOpen(false);

  const choose = (text: string) => {
    onResult(text);
    close();
  };

  const message =
    error === 'permission' ? t('voice.permission')
      : error === 'no-speech' ? t('voice.noSpeech')
        : error === 'network' ? t('voice.network')
          : error ? t('voice.failed')
            : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={prompt ?? t('voice.speak')}
        className={clsx(
          'flex shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors',
          'hover:bg-slate-100 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
          size === 'sm' ? 'h-8 w-8' : 'h-11 w-11',
          className,
        )}
      >
        <MicIcon className={size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} />
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[60] flex flex-col justify-end sm:items-center sm:justify-center">
          <div className="sheet-backdrop absolute inset-0 bg-black/50" onClick={close} aria-hidden />

          <div
            role="dialog"
            aria-modal="true"
            aria-label={prompt ?? t('voice.speak')}
            className="sheet-panel sheet-panel--responsive relative w-full rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl sm:max-w-sm sm:rounded-3xl sm:pb-0"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h2 className="text-base font-semibold text-slate-900">{prompt ?? t('voice.speak')}</h2>
              <button
                type="button"
                onClick={close}
                aria-label={t('common.cancel')}
                className="-mr-1 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-4 py-5">
              {/* The microphone, and whatever is being heard right now. */}
              <div className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={listening ? stop : start}
                  aria-label={listening ? t('voice.stop') : t('voice.speak')}
                  className={clsx(
                    'relative flex h-20 w-20 items-center justify-center rounded-full transition-colors',
                    listening ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500',
                  )}
                >
                  {listening && (
                    <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" aria-hidden />
                  )}
                  <MicIcon className="relative h-8 w-8" />
                </button>

                <p className="min-h-[1.5rem] text-center text-sm text-slate-500">
                  {interim || (listening ? t('voice.listening') : message ?? t('voice.tapToSpeak'))}
                </p>
              </div>

              {alternatives.length > 0 && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="mb-2 text-xs font-medium text-slate-400">{t('voice.pickOne')}</p>
                  <div className="space-y-1.5">
                    {alternatives.map((text, i) => (
                      <button
                        key={text}
                        type="button"
                        onClick={() => choose(text)}
                        className={clsx(
                          'flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors',
                          i === 0
                            ? 'border-primary/40 bg-primary/5 hover:bg-primary/10'
                            : 'border-slate-200 hover:bg-slate-50',
                        )}
                      >
                        <span className="text-[15px] font-medium text-slate-900">{text}</span>
                        {i === 0 && (
                          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            {t('voice.best')}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={start}
                    className="mt-3 w-full rounded-xl py-2 text-sm font-medium text-slate-500 hover:bg-slate-50"
                  >
                    {t('voice.again')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
