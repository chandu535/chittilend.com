/**
 * Choosing a voice.
 *
 * Kept apart from the speaking itself so it can be tested — the browser half has no logic
 * in it, and this is the part that could be wrong.
 *
 * Which voices a phone has is not something the app can choose. Telugu text-to-speech is a
 * separate download on Android and plenty of devices do not have it, so the voice has to be
 * looked at before the sentence is built — a Telugu sentence handed to an English voice is
 * not accented, it is noise.
 */

/** Just enough of SpeechSynthesisVoice to choose one, so this can be tested with plain objects. */
export interface VoiceLike {
  lang: string;
  name: string;
  localService?: boolean;
}

export type SpeechLang = 'te' | 'en';

export interface VoiceChoice<V extends VoiceLike> {
  voice: V;
  lang: SpeechLang;
}

/**
 * The best available voice, and the language its sentence must be written in.
 *
 * Telugu wins outright. Failing that, Indian English is preferred over any other English:
 * the names are Indian and so are the amounts, and en-IN handles both far better than en-US.
 *
 * Returns null when there is nothing usable, and the caller then says nothing at all rather
 * than reading Telugu through a voice that cannot pronounce it.
 */
export function pickVoice<V extends VoiceLike>(voices: readonly V[]): VoiceChoice<V> | null {
  const usable = voices.filter((v) => typeof v?.lang === 'string' && v.lang);

  const telugu = usable.find((v) => v.lang.toLowerCase().startsWith('te'));
  if (telugu) return { voice: telugu, lang: 'te' };

  const indianEnglish = usable.find((v) => v.lang.toLowerCase().replace('_', '-') === 'en-in');
  if (indianEnglish) return { voice: indianEnglish, lang: 'en' };

  const anyEnglish = usable.find((v) => v.lang.toLowerCase().startsWith('en'));
  if (anyEnglish) return { voice: anyEnglish, lang: 'en' };

  return null;
}
