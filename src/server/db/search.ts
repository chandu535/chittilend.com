import { ilike, or, sql, type SQL } from 'drizzle-orm';
import { borrowers } from './schema';

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
