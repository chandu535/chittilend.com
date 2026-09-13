import { teluguNumberWords } from './teluguNumbers';

/**
 * Deciding what to say, and in which voice.
 *
 * Kept apart from the speaking itself so it can be tested. The browser half is four lines
 * of speechSynthesis with no logic in it; everything that could be wrong is here.
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

export interface EntrySpeech {
  /** The borrower's name in Latin script, as stored. */
  name: string;
  /** The Telugu spelling, where there is one. */
  nameTelugu?: string | null;
  amount: number;
  kind: 'taken' | 'given';
  lang: SpeechLang;
}

/**
 * One line of the day book, said aloud.
 *
 * Name, amount, verb — the same three things the row shows, in that order. It is a receipt
 * for the line just written, not a summary: no loan number, no balance, no status.
 *
 * The verb describes what the *borrower* did, because the borrower is the subject of the
 * sentence. That is the opposite of what the row's own field is called: `kind: 'taken'` is
 * money the collector took, which is money the borrower gave. Saying "Suresh ... I took"
 * names one person and conjugates for another, which is not a sentence in Telugu or in
 * anything else.
 *
 * The verb goes last because it is the part being checked. "సురేష్ రెండు వేల ఐదు వందలు" is
 * ambiguous until the final word settles which way the money moved.
 */
export function entrySentence({ name, nameTelugu, amount, kind, lang }: EntrySpeech): string {
  if (lang === 'te') {
    const spoken = nameTelugu?.trim() || name;
    /*
      ఇచ్చారు and తీసుకున్నారు rather than ఇచ్చాడు and తీసుకున్నాడు.

      Telugu conjugates the verb for the subject's gender, and no gender is recorded against
      a borrower — there is no column for it and no reason to add one. The masculine form
      would therefore be wrong for every woman in the book. These are the honorific forms:
      correct for anyone, and the politer way to speak about a customer regardless.
    */
    const verb = kind === 'taken' ? 'ఇచ్చారు' : 'తీసుకున్నారు';
    return `${spoken} ${teluguNumberWords(amount)} ${verb}`;
  }

  // An English voice gets the Latin name; handed Telugu script it produces nothing useful.
  const rupees = Math.round(Math.abs(amount)).toLocaleString('en-IN');
  return `${name} ${kind === 'taken' ? 'gave' : 'took'} ${rupees} rupees`;
}
