import { describe, it, expect } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import { borrowerSearchCondition } from './search';

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
    expect(query.params).toHaveLength(3);
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
    expect(compile('venkata')!.params).toEqual(['%venkata%', '%venkata%', '%venkata%']);
  });

  it('keeps Telugu text intact', () => {
    expect(compile('నాగరాజు')!.params[0]).toBe('%నాగరాజు%');
  });
});
