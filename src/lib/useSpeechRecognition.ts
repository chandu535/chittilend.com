import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Minimal shape of the Web Speech API. It is not in lib.dom, and Chrome still exposes it
 * under the webkit prefix.
 */
interface SpeechAlternative { transcript: string; confidence: number }
interface SpeechResult { readonly length: number; isFinal: boolean; [i: number]: SpeechAlternative }
interface SpeechResultList { readonly length: number; [i: number]: SpeechResult }
interface SpeechEvent extends Event { resultIndex: number; results: SpeechResultList }
interface SpeechErrorEvent extends Event { error: string }

interface Recognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechEvent) => void) | null;
  onerror: ((e: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

type RecognitionCtor = new () => Recognition;

function constructor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** True where dictation is actually available — Chrome and Android, not iOS Safari. */
export function isSpeechSupported(): boolean {
  return constructor() !== null;
}

export type SpeechErrorKind = 'permission' | 'no-speech' | 'network' | 'unknown';

interface SpeechState {
  listening: boolean;
  /** What is being heard right now, before the engine commits to it. */
  interim: string;
  /** Final readings, best first. The engine returns several; the caller picks. */
  alternatives: string[];
  error: SpeechErrorKind | null;
}

const IDLE: SpeechState = { listening: false, interim: '', alternatives: [], error: null };

/**
 * Dictation, for names.
 *
 * Borrowers here often read Telugu but do not type it, and the people entering them are
 * working from speech anyway. Recognition runs in `te-IN` so what comes back is already
 * Telugu — no transliteration step to get wrong.
 *
 * The engine returns ranked alternatives rather than one answer, which is the honest
 * shape of the problem: a spoken name has several plausible spellings, and the person
 * holding the phone knows which is right. They are surfaced for choosing rather than the
 * first being taken silently.
 */
export function useSpeechRecognition(lang = 'te-IN') {
  const [state, setState] = useState<SpeechState>(IDLE);
  const recognition = useRef<Recognition | null>(null);
  // Set when the caller stops on purpose, so a deliberate stop is not reported as an
  // error and does not clear what has already been heard.
  const stopping = useRef(false);

  const release = useCallback(() => {
    const current = recognition.current;
    if (!current) return;
    current.onresult = null;
    current.onerror = null;
    current.onend = null;
    current.onstart = null;
    try { current.abort(); } catch { /* already gone */ }
    recognition.current = null;
  }, []);

  // The microphone must not stay open because a screen was closed mid-sentence.
  useEffect(() => release, [release]);

  const start = useCallback(() => {
    const Ctor = constructor();
    if (!Ctor) { setState({ ...IDLE, error: 'unknown' }); return; }

    release();
    stopping.current = false;
    setState({ ...IDLE, listening: true });

    const engine = new Ctor();
    engine.lang = lang;
    engine.continuous = false;
    engine.interimResults = true;   // live text, so it is clear it is hearing something
    engine.maxAlternatives = 5;     // the choices offered at the end

    engine.onresult = (event) => {
      let interim = '';
      const finals: string[] = [];

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          for (let a = 0; a < result.length; a++) {
            const text = result[a].transcript.trim();
            if (text) finals.push(text);
          }
        } else {
          interim += result[0].transcript;
        }
      }

      setState((current) => ({
        ...current,
        interim,
        // Duplicates are common across alternatives; the order is the engine's ranking.
        alternatives: finals.length ? [...new Set([...current.alternatives, ...finals])] : current.alternatives,
      }));
    };

    engine.onerror = (event) => {
      const kind: SpeechErrorKind =
        event.error === 'not-allowed' || event.error === 'service-not-allowed' ? 'permission'
          : event.error === 'no-speech' ? 'no-speech'
            : event.error === 'network' ? 'network'
              : 'unknown';
      // Aborting on purpose surfaces as an error; that is not one.
      if (stopping.current && kind === 'unknown') return;
      setState((current) => ({ ...current, listening: false, error: kind }));
    };

    engine.onend = () => setState((current) => ({ ...current, listening: false, interim: '' }));

    recognition.current = engine;
    try {
      engine.start();
    } catch {
      setState({ ...IDLE, error: 'unknown' });
    }
  }, [lang, release]);

  const stop = useCallback(() => {
    stopping.current = true;
    try { recognition.current?.stop(); } catch { /* already stopped */ }
    setState((current) => ({ ...current, listening: false }));
  }, []);

  const reset = useCallback(() => { release(); setState(IDLE); }, [release]);

  return { ...state, start, stop, reset, supported: isSpeechSupported() };
}
