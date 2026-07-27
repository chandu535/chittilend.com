import { describe, it, expect } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import { borrowerSearchCondition, borrowerSearchRelevance } from './search';

/**
 * The loans list once matched only `name` while the borrowers list also matched the
 * Telugu spelling and the mobile, so the same text found a person on one screen and
 * nothing on the other. Both now call this, and these tests fail if either the columns
 * or the matching change without the other list coming along.
 *
 * Compiled through the dialect rather than run against a database, so the assertions are
 * about the SQL itself and need no connection.
 */
const dialect = new PgDialect();

function compile(term: string) {
  const condition = borrowerSearchCondition(term);
  if (!condition) return null;
  return dialect.sqlToQuery(condition);
}

describe('borrowerSearchCondition', () => {
  it('searches the English name, the Telugu name and the mobile', () => {
    const query = compile('venkata')!;
    expect(query.sql).toContain('"name"');
    expect(query.sql).toContain('"name_telugu"');
    expect(query.sql).toContain('"mobile"');
    // Three exact patterns, plus the term and threshold for each fuzzy comparison.
    expect(query.params.filter((p) => p === '%venkata%')).toHaveLength(3);
  });

  it('matches any of the three rather than all of them', () => {
    expect(compile('venkata')!.sql.toLowerCase()).toContain(' or ');
  });

  it('is undefined for an empty term, so an empty box filters nothing out', () => {
    expect(borrowerSearchCondition('')).toBeUndefined();
    expect(borrowerSearchCondition('   ')).toBeUndefined();
  });

  it('ignores surrounding whitespace, which pasted text usually carries', () => {
    expect(compile('  వెంకట  ')!.params).toEqual(compile('వెంకట')!.params);
  });

  it('matches on a fragment rather than the whole value', () => {
    expect(compile('venkata')!.params).toContain('%venkata%');
  });

  it('keeps Telugu text intact', () => {
    expect(compile('నాగరాజు')!.params[0]).toBe('%నాగరాజు%');
  });

  describe('typed in English, searched in Telugu too', () => {
    it('searches the Telugu reading alongside the English text', () => {
      const q = dialect.sqlToQuery(borrowerSearchCondition('venkata', ['వెంకట'])!);
      expect(q.params).toContain('%venkata%');
      expect(q.params).toContain('%వెంకట%');
    });

    it('uses one reading, not all of them', () => {
      // Fuzzy matching already bridges spelling variants, and the extra guesses were
      // where false positives came from: the third reading of "yesu" is ఎస్, which sits
      // inside the unrelated ఎస్ రాంబాబు.
      const q = dialect.sqlToQuery(borrowerSearchCondition('yesu', ['యేసు', 'ఏసు', 'ఎస్'])!);
      expect(q.params).toContain('%యేసు%');
      expect(q.params).not.toContain('%ఏసు%');
      expect(q.params).not.toContain('%ఎస్%');
    });

    it('rejects a reading that is one character repeated', () => {
      // "qqqq" transliterates to క్క్క్క్, which trigram-matched 42 of 178 borrowers.
      const q = dialect.sqlToQuery(borrowerSearchCondition('qqqq', ['క్క్క్క్'])!);
      expect(q.params).toEqual(['%qqqq%', '%qqqq%', '%qqqq%', 'qqqq', 0.3, 'qqqq', 0.3]);
    });

    it('accepts a single reading as a plain string', () => {
      expect(dialect.sqlToQuery(borrowerSearchCondition('venkata', 'వెంకట')!).params)
        .toContain('%వెంకట%');
    });

    it('still returns nothing when there is no term at all', () => {
      expect(borrowerSearchCondition('', [])).toBeUndefined();
      expect(borrowerSearchCondition('', ['వెంకట'])).toBeDefined();
    });
  });

  describe('matching close spellings, not just exact ones', () => {
    it('compares the term against part of the name', () => {
      expect(dialect.sqlToQuery(borrowerSearchCondition('venkata')!).sql)
        .toContain('word_similarity');
    });

    it('does not fuzzy-match a mobile number', () => {
      // A near-miss on a phone number is simply a different phone number.
      const q = dialect.sqlToQuery(borrowerSearchCondition('9876543210')!);
      expect(q.sql).not.toContain('word_similarity');
    });

    it('does not fuzzy-match on one or two characters', () => {
      expect(dialect.sqlToQuery(borrowerSearchCondition('ve')!).sql)
        .not.toContain('word_similarity');
    });

    it('ranks exact hits above close ones', () => {
      const q = dialect.sqlToQuery(borrowerSearchRelevance('venkata')!);
      // The exact branch scores 2, above any similarity, which cannot exceed 1.
      expect(q.sql).toContain('THEN 2');
      expect(q.sql).toContain('GREATEST');
    });

    it('has no relevance to report without a term', () => {
      expect(borrowerSearchRelevance('', [])).toBeUndefined();
    });
  });
});
