import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { useSpeechRecognition } from '@/lib/useSpeechRecognition';

/**
 * Talking to the ledger, rather than dictating into a search box.
 *
 * The microphone on the other screens opens a dialog, listens, and offers five readings of
 * what it heard so the right spelling of a name can be picked. That is correct for a search
 * box — file somebody under the wrong spelling and they are lost — and it is the wrong shape
 * entirely here. It asks for three interactions before a question is even sent, and the
 * pause to choose between readings is the moment the thing stops feeling like something you
 * are talking to.
 *
 * So this is one button and no dialog. Press it, speak, stop speaking; the question goes on
 * its own, the answer is read out, and it starts listening again for whatever follows. The
 * loop runs until it is pressed a second time. A wrong reading is recoverable here in a way
 * it is not in a search box — the question is on screen, the query beneath it, and the
 * remedy is to say it again.
 *
 * Every state is announced by the button itself, because the person this is for cannot read
 * the label under it: colour and motion carry it. Gold and still means it is your turn.
 */

export type AgentState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface VoiceAgentProps {
  /** Called with the finished question. */
  onAsk: (question: string) => void;
  /** True from the moment the question is sent until the answer has been spoken. */
  busy: boolean;
  /** True while the answer is being read aloud, so the button can show it. */
  speaking: boolean;
  /** Stops whatever is being said, for the turn to be taken back. */
  onInterrupt: () => void;
}

export function VoiceAgent({ onAsk, busy, speaking, onInterrupt }: VoiceAgentProps) {
  const { t } = useTranslation();
  const { listening, interim, alternatives, error, start, stop, reset, supported } = useSpeechRecognition();

  /** The conversation continues until the button is pressed again. */
  const [engaged, setEngaged] = useState(false);
  const engagedRef = useRef(false);
  engagedRef.current = engaged;

  // What has already been sent, so one recognition result cannot ask twice.
  const sentRef = useRef<string | null>(null);

  /*
    A finished reading is a finished question.

    The engine settles on its best reading and stops; `alternatives` arrives ranked, and the
    first is taken without asking. The four below it are what the search box exists to offer
    and what this one deliberately does not.
  */
  useEffect(() => {
    if (!engaged || listening || busy) return;
    const heard = alternatives[0]?.trim();
    if (!heard || heard === sentRef.current) return;

    sentRef.current = heard;
    reset();
    onAsk(heard);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engaged, listening, busy, alternatives]);

  /*
    Its turn ends, yours begins.

    Listening resumes only once the answer has finished being spoken — start it any earlier
    and the microphone hears the phone's own voice and asks the answer back as a question.
  */
  useEffect(() => {
    if (!engaged || busy || speaking || listening) return;
    const timer = setTimeout(() => {
      if (engagedRef.current) { sentRef.current = null; start(); }
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engaged, busy, speaking, listening]);

  // Leaving the screen mid-sentence should not leave the microphone on.
  useEffect(() => () => { stop(); reset(); }, [stop, reset]);

  if (!supported) return null;

  const state: AgentState = speaking ? 'speaking' : busy ? 'thinking' : listening ? 'listening' : 'idle';

  const toggle = () => {
    if (engaged) {
      setEngaged(false);
      stop();
      reset();
      onInterrupt();
      return;
    }
    setEngaged(true);
    sentRef.current = null;
    onInterrupt();
    start();
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        aria-label={t(`ask.voice.${state}`)}
        aria-pressed={engaged}
        className={clsx(
          'relative flex h-20 w-20 items-center justify-center rounded-full transition-colors',
          state === 'idle' && 'bg-gold text-on-gold',
          state === 'listening' && 'bg-red-500 text-white',
          state === 'thinking' && 'bg-primary text-on-primary',
          state === 'speaking' && 'bg-emerald-600 text-white',
        )}
      >
        {/* A ring that only moves while it is listening, so the state is legible across a
            room and without reading anything. */}
        {state === 'listening' && (
          <span className="absolute inset-0 animate-ping rounded-full bg-red-500/40" />
        )}

        {state === 'thinking' ? (
          <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-white/30 border-t-white" />
        ) : state === 'speaking' ? (
          <svg className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H2v6h4l5 4V5z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13" />
          </svg>
        ) : (
          <svg className="relative h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m0 0h3.75m-3.75 0H8.25M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>

      {/* The words it is hearing, live. Proof it is listening to the right person. */}
      <p className="min-h-5 max-w-xs truncate text-center text-sm text-slate-500">
        {error === 'permission' ? t('ask.voice.permission')
          : interim || (engaged ? t(`ask.voice.${state}`) : t('ask.voice.tapToTalk'))}
      </p>
    </div>
  );
}
