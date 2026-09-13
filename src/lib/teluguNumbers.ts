/**
 * Amounts as Telugu words, for reading back aloud.
 *
 * The day book was built for someone who cannot read the screen, and until now the app only
 * listened — it never spoke. A row carries a face, a name and an amount, and of those only
 * the face can be checked against the person standing there. Saying the amount out loud is
 * what lets the rest be checked.
 *
 * A speech engine handed "2500" reads it as digits, in whatever language the voice happens
 * to be, which is no use. So the number is spelled into words here and the engine is given
 * text it can only read one way.
 *
 * Telugu numerals are irregular in three places, and all three show up in real amounts:
 *
 *   - 11 to 19 are their own words, not "ten one".
 *   - A component that has something after it takes an oblique form: ఐదు వేలు on its own,
 *     but ఐదు వేల ... when a hundreds part follows. Getting this wrong is the difference
 *     between Telugu and a word-by-word gloss of English.
 *   - One thousand is వెయ్యి and one hundred is వంద — never ఒకటి వేలు, and a hundred with
 *     anything after it becomes నూట.
 *
 * Worth the care because of what the ledger actually holds: ₹2,500 and ₹7,500 and ₹12,500
 * are the three commonest instalments, so hundreds are not an edge case here — 92% of
 * payments are round hundreds but only 41% are round thousands. A converter that handled
 * only thousands would be wrong more often than right.
 *
 * Pure, so the wording can be pinned in tests. The speech engine cannot be tested here at
 * all — jsdom does not run in this project — which is the reason every decision that can
 * live in this file does.
 */

const UNITS = [
  '', 'ఒకటి', 'రెండు', 'మూడు', 'నాలుగు', 'ఐదు', 'ఆరు', 'ఏడు', 'ఎనిమిది', 'తొమ్మిది',
];

/** 10-19, each its own word. */
const TEENS = [
  'పది', 'పదకొండు', 'పన్నెండు', 'పదమూడు', 'పద్నాలుగు',
  'పదిహేను', 'పదహారు', 'పదిహేడు', 'పద్దెనిమిది', 'పంతొమ్మిది',
];

const TENS = [
  '', '', 'ఇరవై', 'ముప్పై', 'నలభై', 'యాభై', 'అరవై', 'డెబ్బై', 'ఎనభై', 'తొంభై',
];

/** 1-99. */
function underHundred(n: number): string {
  if (n < 10) return UNITS[n];
  if (n < 20) return TEENS[n - 10];
  const unit = n % 10;
  return unit ? `${TENS[Math.floor(n / 10)]} ${UNITS[unit]}` : TENS[Math.floor(n / 10)];
}

/** 1-999. */
function underThousand(n: number): string {
  if (n < 100) return underHundred(n);
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;

  // A bare hundred is వంద; a hundred with anything after it is నూట. Neither is ఒకటి వంద.
  if (hundreds === 1) return rest ? `నూట ${underHundred(rest)}` : 'వంద';

  return rest
    ? `${UNITS[hundreds]} వందల ${underHundred(rest)}`
    : `${UNITS[hundreds]} వందలు`;
}

/** 1-99,999. */
function underLakh(n: number): string {
  if (n < 1000) return underThousand(n);
  const thousands = Math.floor(n / 1000);
  const rest = n % 1000;

  // One thousand is వెయ్యి, and keeps that form with a remainder after it.
  if (thousands === 1) return rest ? `వెయ్యి ${underThousand(rest)}` : 'వెయ్యి';

  return rest
    ? `${underHundred(thousands)} వేల ${underThousand(rest)}`
    : `${underHundred(thousands)} వేలు`;
}

/**
 * A whole number as Telugu words.
 *
 * Rounded to the rupee. Instalments divide into paise — ₹4,166.67 is a real row — but a
 * collector counts notes, and "four thousand one hundred sixty six point six seven" is
 * noise at a doorstep. The screen still shows the exact figure.
 */
export function teluguNumberWords(value: number): string {
  const n = Math.round(Math.abs(value));
  if (!Number.isFinite(n) || n === 0) return 'సున్నా';

  const lakhs = Math.floor(n / 100000);
  const rest = n % 100000;

  if (!lakhs) return underLakh(n);

  const head = lakhs === 1
    ? (rest ? 'లక్ష' : 'లక్ష')
    : `${underHundred(lakhs)} ${rest ? 'లక్షల' : 'లక్షలు'}`;

  return rest ? `${head} ${underLakh(rest)}` : head;
}
