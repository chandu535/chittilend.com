/**
 * English to Telugu transliteration utility.
 * Converts English-spelled names (typically Telugu/Indian names) to Telugu script.
 * Best-effort phonetic transliteration — works well for common Telugu names.
 */

const VIRAMA = '\u0C4D'; // ్

// Consonant patterns, sorted longest first for greedy matching
const CONSONANTS: [string, string][] = [
  // Multi-char clusters
  ['ksh', 'క్ష'],
  ['chh', 'ఛ'],

  // Nasal + consonant clusters
  ['nch', 'ంచ'],
  ['nk', 'ంక'],
  ['ng', 'ంగ'],
  ['nj', 'ంజ'],
  ['nt', 'ంత'],
  ['nd', 'ంద'],
  ['mp', 'ంప'],
  ['mb', 'ంబ'],

  // Double consonants (retroflex for dd/tt, others geminate)
  ['dd', `డ${VIRAMA}డ`],
  ['tt', `ట${VIRAMA}ట`],
  ['kk', `క${VIRAMA}క`],
  ['gg', `గ${VIRAMA}గ`],
  ['jj', `జ${VIRAMA}జ`],
  ['nn', `న${VIRAMA}న`],
  ['pp', `ప${VIRAMA}ప`],
  ['bb', `బ${VIRAMA}బ`],
  ['mm', `మ${VIRAMA}మ`],
  ['ll', `ల${VIRAMA}ల`],
  ['ss', `స${VIRAMA}స`],
  ['rr', `ర${VIRAMA}ర`],

  // Aspirated consonants
  ['kh', 'ఖ'],
  ['gh', 'ఘ'],
  ['ch', 'చ'],
  ['jh', 'ఝ'],
  ['th', 'త'],
  ['dh', 'ధ'],
  ['ph', 'ఫ'],
  ['bh', 'భ'],
  ['sh', 'శ'],

  // Single consonants
  ['k', 'క'],
  ['g', 'గ'],
  ['c', 'క'],
  ['j', 'జ'],
  ['t', 'త'],
  ['d', 'ద'],
  ['n', 'న'],
  ['p', 'ప'],
  ['b', 'బ'],
  ['m', 'మ'],
  ['y', 'య'],
  ['r', 'ర'],
  ['l', 'ల'],
  ['v', 'వ'],
  ['w', 'వ'],
  ['s', 'స'],
  ['h', 'హ'],
  ['f', 'ఫ'],
  ['z', 'జ'],
  ['q', 'క'],
  ['x', `క${VIRAMA}స`],
];

// Standalone vowels (at word start or after another vowel)
const VOWELS_STANDALONE: [string, string][] = [
  ['aa', 'ఆ'],
  ['ai', 'ఐ'],
  ['au', 'ఔ'],
  ['ee', 'ఈ'],
  ['oo', 'ఊ'],
  ['ou', 'ఔ'],
  ['ow', 'ఔ'],
  ['a', 'అ'],
  ['e', 'ఎ'],
  ['i', 'ఇ'],
  ['o', 'ఒ'],
  ['u', 'ఉ'],
];

// Vowel signs (matra) after a consonant
const VOWEL_SIGNS: [string, string][] = [
  ['aa', 'ా'],
  ['ai', 'ై'],
  ['au', 'ౌ'],
  ['ee', 'ీ'],
  ['oo', 'ూ'],
  ['ou', 'ౌ'],
  ['ow', 'ౌ'],
  ['a', ''],    // inherent 'a' vowel — no sign needed
  ['e', 'ె'],
  ['i', 'ి'],
  ['o', 'ొ'],
  ['u', 'ు'],
];

function matchConsonant(str: string, pos: number): { telugu: string; len: number } | null {
  const remaining = str.substring(pos);
  for (const [pattern, telugu] of CONSONANTS) {
    if (remaining.startsWith(pattern)) {
      return { telugu, len: pattern.length };
    }
  }
  return null;
}

function matchStandaloneVowel(str: string, pos: number): { telugu: string; len: number } | null {
  const remaining = str.substring(pos);
  for (const [pattern, telugu] of VOWELS_STANDALONE) {
    if (remaining.startsWith(pattern)) {
      return { telugu, len: pattern.length };
    }
  }
  return null;
}

function matchVowelSign(str: string, pos: number): { sign: string; len: number } | null {
  const remaining = str.substring(pos);

  // Special: 'y' at end of word = vowel ి (common in Telugu names like Reddy, Murthy)
  if (remaining === 'y') {
    return { sign: 'ి', len: 1 };
  }

  for (const [pattern, sign] of VOWEL_SIGNS) {
    if (remaining.startsWith(pattern)) {
      return { sign, len: pattern.length };
    }
  }
  return null;
}

function transliterateWord(word: string): string {
  const lower = word.toLowerCase();
  const len = lower.length;
  let result = '';
  let i = 0;

  while (i < len) {
    // Try to match a consonant (longest match first)
    const consonant = matchConsonant(lower, i);
    if (consonant) {
      i += consonant.len;

      // Check for following vowel sign
      const vowelSign = matchVowelSign(lower, i);
      if (vowelSign) {
        result += consonant.telugu + vowelSign.sign;
        i += vowelSign.len;
      } else {
        // No vowel follows — add virama (halant)
        result += consonant.telugu + VIRAMA;
      }
      continue;
    }

    // Try standalone vowel
    const vowel = matchStandaloneVowel(lower, i);
    if (vowel) {
      result += vowel.telugu;
      i += vowel.len;
      continue;
    }

    // Unknown character — pass through as-is
    result += word[i];
    i++;
  }

  return result;
}

/**
 * Transliterate English text to Telugu script.
 * Each word is transliterated independently; spaces/punctuation are preserved.
 */
export function toTelugu(text: string): string {
  if (!text) return text;
  return text.replace(/[a-zA-Z]+/g, (word) => transliterateWord(word));
}
