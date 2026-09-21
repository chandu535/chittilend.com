import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The rules that keep a spoken answer honest.
 *
 * Phrasing is the model's job and arithmetic is not, because it will do arithmetic when
 * asked not to: eight instalments of ₹2,500 were once reported as a total of ₹57,191, and
 * as ₹2,03,620 when the same rows were phrased differently. Both fluent, both invented,
 * with the correct table on screen beside them.
 *
 * The model cannot be tested here — it is a network call with a temperature. What can be
 * tested is the check its output has to pass, which is the part that decides whether a
 * sentence is believed or thrown away.
 */
const SOURCE = readFileSync(join(__dirname, 'reply.ts'), 'utf8');

describe('the guard on a phrased answer', () => {
  it('rejects any reply containing a digit', () => {
    // A digit means the model wrote a number itself rather than repeating one it was given.
    expect(SOURCE).toMatch(/HAS_DIGITS[\s\S]*?test\(reply\)/);
    expect(SOURCE).toMatch(/if \(HAS_DIGITS\.test\(reply\)\) return false/);
  });

  it('rejects a reply that does not contain the answer it was handed', () => {
    // This is the check that would have caught "one borrower" spoken over a table of 180.
    expect(SOURCE).toMatch(/!reply\.includes\(facts\.answerPhrase\)/);
  });

  it('rejects a reply that drops or replaces the total it was handed', () => {
    /*
      The dangerous case is replacement rather than omission: a substituted figure reads
      exactly like the real one. Requiring the given phrase back, character for character,
      catches both.
    */
    expect(SOURCE).toMatch(/!reply\.includes\(facts\.totalPhrase\)/);
  });

  it('falls back to the deterministic sentence rather than failing', () => {
    // The plain version is never the worse answer, only the flatter one.
    expect(SOURCE).toMatch(/return trustworthy\(reply, facts\) \? reply : facts\.fallback/);
    expect(SOURCE).toMatch(/catch \{[\s\S]*?return facts\.fallback/);
  });

  it('forbids the model from calculating, in the words it is given', () => {
    expect(SOURCE).toMatch(/Never calculate/i);
    expect(SOURCE).toMatch(/Never write digits/i);
  });
});

/**
 * A named period is a window. Getting this wrong roughly triples every answer, and it did:
 * a rule about "stopped paying" bled into "this month" and turned a question about one
 * month into every unpaid instalment ever — 73 people and ₹6,28,350 where the truth was
 * 65 and ₹3,78,750.
 */
describe('the schema prompt', () => {
  const PROMPT = readFileSync(join(__dirname, 'schemaPrompt.ts'), 'utf8');

  it('tells the model a period is a window, not a cutoff', () => {
    expect(PROMPT).toMatch(/date_trunc\('month', p\.due_date\) = date_trunc\('month'/);
    expect(PROMPT).toMatch(/does NOT mean everything unpaid up to now/i);
  });

  it('says the period wins when one is named', () => {
    expect(PROMPT).toMatch(/the period wins/i);
  });

  it('warns that created_at is the import timestamp', () => {
    // Every row was written on one day, so "this year" by created_at is the whole ledger.
    expect(PROMPT).toMatch(/created_at/);
    expect(PROMPT).toMatch(/imported on the same day|meaningless for business questions/i);
  });

  it('says the defaulted status is never set', () => {
    expect(PROMPT).toMatch(/nobody sets it|always returns nothing/i);
  });

  it('keeps users and sessions out of reach', () => {
    expect(PROMPT).toMatch(/Never read the users or sessions tables/);
  });
});

/**
 * An empty result is not a fact about the world.
 *
 * The instruction here used to say the opposite — turn no rows into "nobody has stopped
 * paying", "everyone has paid this month" — which reads well and is a lie whenever the query
 * was simply wrong. The owner could see people who owed money while being told there were
 * none.
 */
describe('what an empty result is allowed to mean', () => {
  const SRC = readFileSync(join(__dirname, 'reply.ts'), 'utf8');

  it('forbids turning nothing found into nothing owed', () => {
    expect(SRC).toMatch(/NEVER turn an empty result into a fact/i);
    expect(SRC).toMatch(/do not say nobody owes/i);
  });

  it('says finding nothing is not the same as there being nothing', () => {
    expect(SRC).toMatch(/not the same as there being nothing/i);
  });

  it('makes a truncated total an "at least", never an exact one', () => {
    expect(SRC).toMatch(/at least that much, not exactly/i);
  });
});
