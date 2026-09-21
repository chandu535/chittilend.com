import { askModel } from './groq';

/**
 * Saying the answer, rather than reporting it.
 *
 * The figures are computed here and handed over already written out in Telugu words; the
 * model's whole job is to put a sentence round them. It is never asked to count, add, or
 * work anything out, because it will: asked once to describe eight instalments of ₹2,500
 * using only the numbers in front of it, it reported the total as ₹57,191, and as
 * ₹2,03,620 when the same rows were phrased for a different question. Fluent, confident,
 * invented, with the correct table sitting on screen beside it.
 *
 * So the arithmetic stays in summarise.ts and this adds only language. And because a model
 * told not to calculate will calculate anyway, what comes back is checked: a reply carrying
 * digits, or missing a total it was given, is thrown away for the plain sentence. The
 * deterministic version is never the worse answer — only the flatter one.
 */

export interface AnswerFacts {
  /** What was asked, so the reply answers it rather than describing the rows. */
  question: string;
  rowCount: number;
  /** Already rendered in Telugu words. The model may only repeat these. */
  countPhrase: string | null;
  totalPhrase: string | null;
  /** A few names, so it can mention one where that reads naturally. */
  sampleNames: string[];
  /** The deterministic sentence, used verbatim if the model's is untrustworthy. */
  fallback: string;
}

const SYSTEM = `You are answering questions about a small lending business, out loud, in Telugu.

You are given facts that are already correct. Your only job is to say them as one or two
natural spoken sentences, as a person would answer a question.

ABSOLUTE RULES
- Never calculate, add, estimate, or infer a number. Not even a simple one.
- Use ONLY the number phrases given to you, copied exactly, character for character.
- Never write digits. Numbers appear only as the Telugu words you were handed.
- If no rows were found, say only that you could not find it — "నాకు ఏమీ కనబడలేదు",
  "అది నాకు దొరకలేదు". NEVER turn an empty result into a fact: do not say nobody owes
  anything, or everyone has paid, or there is nothing to collect. Finding nothing means
  the search found nothing, which is not the same as there being nothing.
- If told the list was cut short, say the figures are at least that much, not exactly.
- Do not list more than two names. The full list is on the screen.
- Reply with the sentence only. No preamble, no explanation, no markdown.

Speak plainly, the way somebody would answer across a table.`;

/** Any run of digits. Every number in a spoken reply must be a Telugu word. */
const HAS_DIGITS = /[0-9০-৯౦-౯]/;

export async function phraseAnswer(facts: AnswerFacts): Promise<string> {
  const given = [
    `Question: ${facts.question}`,
    `Rows found: ${facts.rowCount}`,
    facts.countPhrase ? `How many people (use exactly): ${facts.countPhrase}` : null,
    facts.totalPhrase ? `Total amount (use exactly): ${facts.totalPhrase}` : null,
    facts.sampleNames.length ? `Some of the names: ${facts.sampleNames.slice(0, 3).join(', ')}` : null,
  ].filter(Boolean).join('\n');

  let reply: string;
  try {
    reply = (await askModel({ system: SYSTEM, user: given, temperature: 0.3, maxTokens: 200 })).trim();
  } catch {
    // A phrasing call that fails costs the sentence, never the answer.
    return facts.fallback;
  }

  return trustworthy(reply, facts) ? reply : facts.fallback;
}

/**
 * Whether the sentence can be believed.
 *
 * Two ways it cannot. A digit means the model wrote a number itself rather than repeating
 * one it was given. A missing total means it has either dropped the figure that was the
 * answer or replaced it with one of its own — and a replacement is the dangerous case,
 * since it reads exactly like the real thing.
 */
function trustworthy(reply: string, facts: AnswerFacts): boolean {
  if (!reply || reply.length > 400) return false;
  if (HAS_DIGITS.test(reply)) return false;
  if (facts.totalPhrase && !reply.includes(facts.totalPhrase)) return false;
  if (facts.countPhrase && facts.rowCount > 1 && !reply.includes(facts.countPhrase)) return false;
  return true;
}
