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
  it('rejects any digit the model was not shown', () => {
    /*
      Banning digits outright was right while the only figures were amounts — always given
      as Telugu words — and wrong once the rows came too, because a question about a date
      can only be answered with one. Each run is now checked against what was handed over:
      a copied date passes, an invented total does not.
    */
    expect(SOURCE).toMatch(/for \(const run of reply\.match\(DIGIT_RUN\)/);
    expect(SOURCE).toMatch(/if \(!given\.includes\(run\)\) return false/);
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
    expect(SOURCE).toMatch(/Never write a number you were not given/i);
  });

  it('tells it to answer what was asked, not fall back on the name and amount', () => {
    // Asked which date a loan was taken, it read the name and the amount back instead.
    expect(SOURCE).toMatch(/Answer the question that was asked/i);
    expect(SOURCE).toMatch(/Do not fall back on the name and the amount/i);
  });

  it('still bans digits outright where nothing was handed over to copy', () => {
    // phraseRefusal is given no rows at all, so any digit in it is invented.
    expect(SOURCE).toMatch(/!HAS_DIGITS\.test\(said\)/);
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

/**
 * Who it is, and how it talks.
 *
 * Asked "నీ పేరేంటి" it replied "That cannot be answered from the ledger" — in English,
 * because the refusal was an interface string and the app was set to English. Two faults in
 * one sentence: it answers in its own voice whatever the screen is set to, and being asked
 * its name is not a failure to answer.
 */
describe('the assistant\'s own voice', () => {
  const SRC = readFileSync(join(__dirname, 'reply.ts'), 'utf8');

  it('knows its name', () => {
    expect(SRC).toMatch(/శ్రీపే/);
    expect(SRC).toMatch(/SriPay/);
  });

  it('answers a question about itself rather than refusing it', () => {
    expect(SRC).toMatch(/phraseRefusal/);
    expect(SRC).toMatch(/If they asked who you are/i);
  });

  it('never claims to be a person', () => {
    expect(SRC).toMatch(/Never claim to be a person/i);
  });

  it('speaks the way people speak, not the way Telugu is written', () => {
    // The literary register is what the model reaches for unasked, and nobody says it aloud.
    expect(SRC).toMatch(/not the way it is written/i);
    expect(SRC).toMatch(/English words that everybody uses/i);
  });

  it('still refuses to invent a number when it cannot answer', () => {
    // It has been given no figures here, so any digit in the reply is one it made up.
    expect(SRC).toMatch(/!HAS_DIGITS\.test\(said\)/);
  });
});

/**
 * Answering the question that was asked.
 *
 * Asked which date a loan was taken, it replied with the name and the amount — twice — while
 * the date sat in the table underneath. The facts only ever carried a name and a figure, so
 * a question about anything else had nothing to answer from.
 *
 * Handing the rows over fixed that and broke the guard, which demanded the computed total
 * back in every reply: the correct date answer had no total in it and was thrown away for
 * the name-and-amount sentence being fixed. The requirement is now scoped to replies that
 * are actually about money.
 */
describe('questions that are not about money', () => {
  const SRC = readFileSync(join(__dirname, 'reply.ts'), 'utf8');

  it('hands over the rows for a small result', () => {
    expect(SRC).toMatch(/detail\?: string \| null/);
    expect(SRC).toMatch(/copy any date or number from here, exactly/i);
  });

  it('requires the total only when the reply brings money up', () => {
    expect(SRC).toMatch(/const mentionsMoney = reply\.includes\('రూపాయలు'\)/);
    expect(SRC).toMatch(/\(!specific \|\| mentionsMoney\)/);
  });

  it('still requires it outright when no rows were shown', () => {
    // With nothing to copy from, the computed figures are all the reply can be about.
    expect(SRC).toMatch(/const specific = Boolean\(facts\.detail\)/);
  });

  it('still refuses a digit that was never handed over', () => {
    // A copied date passes; an invented total does not, which is the case this exists for.
    expect(SRC).toMatch(/if \(!given\.includes\(run\)\) return false/);
  });
});
