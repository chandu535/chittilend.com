import { eq, ilike, or, sql, type SQL } from 'drizzle-orm';
import { borrowers, loans } from './schema';

/**
 * How close a near-miss has to be before it counts as a match.
 *
 * Measured against the real ledger: genuine near-misses score 0.43 to 1.00 —
 * సుబమ్మ against సుబ్బమ్మ is 0.60, నగరాజు against నాగరాజు is 0.57, and the two
 * spellings of రామకృష్ణ are 0.46 apart — while a nonsense term matches nothing at all.
 * 0.3 sits well below every real match and well above the noise; at that setting a
 * search returns 5 of 178 borrowers rather than a page of maybes.
 */
const FUZZY_THRESHOLD = 0.3;

/** Below this a term is too short for fuzziness to mean anything. */
const MIN_FUZZY_LENGTH = 3;

/**
 * Rejects a transliteration that is mostly the same character repeated.
 *
 * Nonsense in produces nonsense out: "qqqq" transliterates to క్క్క్క్, which is little
 * more than a consonant and a virama over and over. Almost every Telugu name contains
 * those, so it trigram-matched 42 of 178 borrowers. Real names are varied — వెంకట has
 * five distinct characters out of five — so the ratio of distinct characters separates
 * them cleanly.
 */
function isDegenerate(candidate: string): boolean {
  if (candidate.length < 3) return true;
  return new Set(candidate).size / candidate.length < 0.4;
}

function termsFor(term: string, alsoTelugu: string | string[]): string[] {
  // One Telugu reading, not several. Passing all of Google's suggestions was worth it
  // while matching was exact — the ledger spells one borrower రామక్రిష్ణ, Google's second
  // guess — but fuzzy matching already bridges that (those two spellings score 0.46), and
  // the extra guesses are where the false positives came from: the third reading of
  // "yesu" is ఎస్, which sits inside the unrelated ఎస్ రాంబాబు.
  const candidates = (Array.isArray(alsoTelugu) ? alsoTelugu : [alsoTelugu]).map((c) => c.trim());
  const usable = candidates.find((c) => c && !isDegenerate(c));
  return [...new Set([term.trim(), usable ?? ''])].filter(Boolean);
}

/**
 * What "search" means when you type into any list in this app.
 *
 * It has to be one rule. The loans list once matched only `name` while the borrowers list
 * matched the Telugu spelling and the mobile too, so the same text found a person on one
 * screen and nothing on the other — which reads as the app losing data rather than as two
 * queries disagreeing.
 *
 * Matching is exact or close. Transliteration cannot be exact — "subamma" and
 * "subbamma" are the same person spoken aloud but different strings, and only one of them
 * equals what is stored — so an exact-only search fails on a single doubled consonant.
 * Trigram similarity against part of the name closes that gap; a mobile number is matched
 * exactly, since a near-miss on a phone number is simply a different phone number.
 */
export function borrowerSearchCondition(
  term: string,
  alsoTelugu: string | string[] = [],
): SQL | undefined {
  const terms = termsFor(term, alsoTelugu);
  if (!terms.length) return undefined;

  const matches = terms.flatMap((value) => {
    const pattern = `%${value}%`;
    const exact = [
      ilike(borrowers.name, pattern),
      ilike(borrowers.nameTelugu, pattern),
      ilike(borrowers.mobile, pattern),
    ];

    // A phone number is never approximately right, and two characters are too few to
    // judge closeness by.
    if (value.length < MIN_FUZZY_LENGTH || /^\d+$/.test(value)) return exact;

    return [
      ...exact,
      // word_similarity compares the term against the best-matching part of the name, so
      // one word out of a full name is enough.
      sql`word_similarity(${value}, ${borrowers.name}) > ${FUZZY_THRESHOLD}`,
      sql`word_similarity(${value}, COALESCE(${borrowers.nameTelugu}, '')) > ${FUZZY_THRESHOLD}`,
    ];
  });

  return matches.length === 1 ? matches[0] : or(...matches);
}

/**
 * How well a borrower matches, for ordering results.
 *
 * Without this a loose near-miss can sit above the person actually being looked for.
 * Exact substring hits are pinned above everything fuzzy, and within each group the
 * closest match comes first.
 */
export function borrowerSearchRelevance(
  term: string,
  alsoTelugu: string | string[] = [],
): SQL | undefined {
  const terms = termsFor(term, alsoTelugu);
  if (!terms.length) return undefined;

  const scores = terms.flatMap((value) => {
    const pattern = `%${value}%`;
    return [
      // 2 keeps every exact hit above every fuzzy one, whatever their similarity.
      sql`(CASE WHEN ${borrowers.name} ILIKE ${pattern} OR COALESCE(${borrowers.nameTelugu}, '') ILIKE ${pattern} OR ${borrowers.mobile} ILIKE ${pattern} THEN 2 ELSE 0 END)`,
      value.length < MIN_FUZZY_LENGTH || /^\d+$/.test(value)
        ? sql`0`
        : sql`GREATEST(word_similarity(${value}, ${borrowers.name}), word_similarity(${value}, COALESCE(${borrowers.nameTelugu}, '')))`,
    ];
  });

  return sql`GREATEST(${sql.join(scores, sql`, `)})`;
}

/**
 * The loan number a term is asking for, or null if it is not asking for one.
 *
 * Loans are spoken about by number — "loan 16", "#142" — and that number is the only
 * identifier a person ever quotes, so it has to be typeable into the same box as a name.
 * The hash is optional because nobody reaches for it on a phone keypad.
 *
 * Deliberately strict: only a whole number, optionally hashed, and nothing else. A term
 * like "9876543210" is a mobile number rather than loan nine billion, so the bound keeps
 * this from claiming one. Numbers that fall through are still matched as text against the
 * mobile, which is what they almost certainly are.
 */
export function loanNumberFrom(term: string): number | null {
  const match = term.trim().match(/^#?(\d{1,7})$/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

/**
 * What "search" means on the loans list, which is the borrower rule plus the loan's own
 * number.
 *
 * Kept beside borrowerSearchCondition rather than folded into it, because the two are
 * asked on different tables: the borrowers list has no loan number to match and would
 * fail to compile against one.
 */
export function loanSearchCondition(
  term: string,
  alsoTelugu: string | string[] = [],
): SQL | undefined {
  const byBorrower = borrowerSearchCondition(term, alsoTelugu);
  const loanNumber = loanNumberFrom(term);
  if (loanNumber === null) return byBorrower;

  const byNumber = eq(loans.loanNumber, loanNumber);
  return byBorrower ? or(byNumber, byBorrower) : byNumber;
}

/**
 * How well a loan matches, for ordering results.
 *
 * An exact loan number outranks everything. Someone who types 16 wants loan 16, not the
 * borrower whose mobile happens to contain those digits — and with the borrower scale
 * topping out at 2, scoring it 3 puts it first without having to special-case the sort.
 */
export function loanSearchRelevance(
  term: string,
  alsoTelugu: string | string[] = [],
): SQL | undefined {
  const byBorrower = borrowerSearchRelevance(term, alsoTelugu);
  const loanNumber = loanNumberFrom(term);
  if (loanNumber === null) return byBorrower;

  const exact = sql`(CASE WHEN ${loans.loanNumber} = ${loanNumber} THEN 3 ELSE 0 END)`;
  return byBorrower ? sql`GREATEST(${exact}, ${byBorrower})` : exact;
}
