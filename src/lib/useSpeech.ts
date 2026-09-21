import { useCallback, useEffect, useRef, useState } from 'react';
import { pickVoice, type VoiceChoice, type VoiceLike } from './speech';

/**
 * Saying something out loud.
 *
 * The thin half on purpose. Everything that could be wrong — which voice, which language,
 * which words — lives in speech.ts and teluguNumbers.ts where it is tested; this is the part
 * that cannot be, because jsdom does not run in this project and speechSynthesis exists
 * nowhere else. So it holds no rules of its own.
 */

const READ_BACK_KEY = 'chittilend-readback';

/**
 * On unless switched off.
 *
 * The screen this serves is for someone who cannot read it, so silence is the setting that
 * needs choosing, not sound. Stored per device like the theme: whether the phone should talk
 * is a property of the phone and the place it is used, not of the account.
 */
export function isReadBackOn(): boolean {
  try {
    return localStorage.getItem(READ_BACK_KEY) !== 'off';
  } catch {
    // Private mode, or storage refused. Speaking is the better default.
    return true;
  }
}

export function setReadBackOn(on: boolean): void {
  try {
    localStorage.setItem(READ_BACK_KEY, on ? 'on' : 'off');
  } catch {
    // Nothing to do; the preference just will not survive the tab.
  }
}

export function useSpeech() {
  const [choice, setChoice] = useState<VoiceChoice<VoiceLike & SpeechSynthesisVoice> | null>(null);
  // Whether a list is being read, so the screen can offer a stop instead of a play.
  const [reading, setReading] = useState(false);
  // Bumped on every stop. A queue that was cancelled mid-way checks this before speaking
  // its next line, so an old list cannot resume underneath a new one.
  const runRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    /*
      Voices arrive late, and on Safari the first getVoices() is reliably empty — the list is
      populated asynchronously and announced with voiceschanged. Reading it once at mount
      would decide there is no Telugu voice on exactly the devices that have one.
    */
    const load = () => {
      const voices = window.speechSynthesis.getVoices() as (VoiceLike & SpeechSynthesisVoice)[];
      if (voices.length) setChoice(pickVoice(voices));
    };

    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  const cancel = useCallback(() => {
    runRef.current += 1;
    setReading(false);
    try {
      window.speechSynthesis?.cancel();
    } catch {
      // Nothing said, nothing to stop.
    }
  }, []);

  /**
   * Says a sentence that is already written.
   *
   * The assistant phrases its own answers, so unlike a day-book line there is nothing to
   * compose here. It still goes through the same voice, mute setting and cancel, because a
   * second way to make the phone talk would be a second way to get those wrong.
   */
  const speakText = useCallback((text: string) => {
    if (!choice || !isReadBackOn() || !text.trim()) return;

    runRef.current += 1;
    const run = runRef.current;

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = choice.voice;
      utterance.lang = choice.voice.lang;
      utterance.rate = 0.9;

      /*
        Reporting that it is speaking is not decoration — the voice agent waits on it before
        turning the microphone back on. This did not set it, so a one-sentence answer left
        `reading` false the whole time it was being read; the agent decided its turn was
        over, opened the microphone, heard the phone finishing the sentence, and asked the
        answer back as a question. Then answered that. The loop the owner watched run.
      */
      const done = () => { if (run === runRef.current) setReading(false); };
      utterance.onend = done;
      utterance.onerror = done;

      window.speechSynthesis.cancel();
      setReading(true);
      window.speechSynthesis.speak(utterance);
    } catch {
      // A silent phone is not a failed answer.
      setReading(false);
    }
  }, [choice]);

  /**
   * Reads a list aloud, one line at a time, and can be stopped.
   *
   * Queued rather than joined into one long string, because a person listening to eighty
   * names needs the gaps — and because a single utterance cannot be interrupted cleanly
   * partway through. Each line waits for the one before it to finish, so the pacing is the
   * engine's own rather than a guess at how long a name takes to say.
   *
   * The stop matters more than the play. Starting eighty names by accident with no way to
   * halt them is worse than never offering it, so `cancel` invalidates the run and the
   * queue checks that before every line.
   */
  const speakList = useCallback((lines: string[]) => {
    if (!choice || !isReadBackOn() || !lines.length) return;

    runRef.current += 1;
    const run = runRef.current;
    setReading(true);

    const sayFrom = (index: number) => {
      // A newer run started, or someone pressed stop.
      if (run !== runRef.current) return;
      if (index >= lines.length) { setReading(false); return; }

      try {
        const utterance = new SpeechSynthesisUtterance(lines[index]);
        utterance.voice = choice.voice;
        utterance.lang = choice.voice.lang;
        utterance.rate = 0.9;
        utterance.onend = () => sayFrom(index + 1);
        // A line that fails to speak must not stall the rest of the list.
        utterance.onerror = () => sayFrom(index + 1);
        window.speechSynthesis.speak(utterance);
      } catch {
        setReading(false);
      }
    };

    try {
      window.speechSynthesis.cancel();
    } catch {
      // Nothing to clear.
    }
    sayFrom(0);
  }, [choice]);

  return {
    speakText,
    speakList,
    reading,
    cancel,
    /** False where the device has no voice this can use — hide the replay control. */
    available: choice !== null,
    /** For the settings screen, so it can say what it will actually sound like. */
    voiceLabel: choice ? `${choice.voice.name} (${choice.voice.lang})` : null,
    spokenLang: choice?.lang ?? null,
  };
}
