import { describe, it, expect } from 'vitest';
import { guardSql } from './sqlGuard';

const ok = (sql: string) => guardSql(sql);
const refused = (sql: string) => {
  const r = guardSql(sql);
  expect(r.ok, `should have been refused: ${sql}`).toBe(false);
  return r as { ok: false; reason: string };
};

/**
 * The assistant writes these queries, so they are treated as text from outside the app —
 * because that is what they are. A question typed by a user reaches the model, and whatever
 * comes back arrives here.
 */
describe('guardSql', () => {
  describe('what it lets through', () => {
    it('allows a plain select', () => {
      const r = ok('SELECT name FROM borrowers WHERE deleted_at IS NULL');
      expect(r.ok).toBe(true);
    });

    it('allows a CTE, which the model uses for anything with a total in it', () => {
      expect(ok('WITH t AS (SELECT 1 AS n) SELECT n FROM t').ok).toBe(true);
    });

    it('is not fooled by a column whose name contains a keyword', () => {
      // `deleted_at` contains "delete"; word boundaries are what keep the list usable.
      expect(ok('SELECT deleted_at, created_at FROM loans').ok).toBe(true);
      expect(ok('SELECT amount_due FROM payments').ok).toBe(true);
    });
  });

  describe('what it refuses', () => {
    it.each([
      ['DELETE FROM loans', 'a write'],
      ['UPDATE loans SET status = $$x$$', 'a write'],
      ['INSERT INTO loans VALUES (1)', 'a write'],
      ['DROP TABLE payments', 'structure'],
      ['TRUNCATE payments', 'structure'],
      ['GRANT ALL ON loans TO public', 'permissions'],
    ])('%s', (sql) => {
      refused(sql);
    });

    it('refuses a second statement hidden behind a semicolon', () => {
      const r = refused('SELECT 1; DROP TABLE loans');
      expect(r.reason).toMatch(/one statement/i);
    });

    it('refuses a write hidden behind a line comment', () => {
      /*
        The classic. A scanner that checks the raw text sees a harmless SELECT because the
        dangerous part looks commented out — but the comment ends at the newline, and the
        next line runs. Comments are stripped before anything is judged, so this is caught.
      */
      refused('SELECT 1 -- harmless\n; DROP TABLE loans');
    });

    it('refuses a write hidden behind a block comment', () => {
      refused('SELECT /* nothing to see */ 1; DELETE FROM payments');
    });

    it('refuses anything that is not a query at all', () => {
      refused('DO $$ BEGIN PERFORM 1; END $$');
      refused('pg_sleep(10)');
    });

    it('refuses a query that stalls the database', () => {
      refused('SELECT pg_sleep(30)');
    });

    it('refuses writing results out to a file or table', () => {
      refused('SELECT * FROM loans INTO OUTFILE');
      refused('COPY loans TO $$/tmp/x$$');
    });
  });

  describe('the two tables it must never read', () => {
    it('refuses the users table, which holds password hashes', () => {
      const r = refused('SELECT email, password_hash FROM users');
      expect(r.reason).toMatch(/users/);
    });

    it('refuses the sessions table, which holds live tokens', () => {
      refused('SELECT token FROM sessions');
    });

    it('refuses them inside a join, not only at the front', () => {
      refused('SELECT b.name, u.email FROM borrowers b JOIN users u ON true');
    });

    it('refuses the catalogue tables that hold role passwords', () => {
      refused('SELECT * FROM pg_shadow');
      refused('SELECT rolname FROM pg_authid');
    });
  });

  describe('bounding the result', () => {
    it('adds a limit when the query has none', () => {
      const r = ok('SELECT name FROM borrowers');
      expect(r.ok && r.sql).toMatch(/LIMIT 500$/);
    });

    it('keeps the uncapped query, so totals are not taken from one page', () => {
      /*
        The cap was 200, and "who owes us money" matches 256 instalments — so the total was
        added up over the first page and came out ₹1,68,250 short, stated as fact. Totals
        come from an aggregate over this instead.
      */
      const r = ok('SELECT name FROM borrowers');
      expect(r.ok && r.unbounded).toBe('SELECT name FROM borrowers');
      expect(r.ok && r.unbounded).not.toMatch(/LIMIT/);
      expect(r.ok && r.limit).toBe(500);
    });

    it('reports no cap of its own when the query brought one', () => {
      // Nothing was truncated by us, so the caller must not claim the total is partial.
      const r = ok('SELECT name FROM borrowers LIMIT 5');
      expect(r.ok && r.limit).toBe(0);
    });

    it('leaves an existing limit alone', () => {
      const r = ok('SELECT name FROM borrowers LIMIT 5');
      expect(r.ok && r.sql).toBe('SELECT name FROM borrowers LIMIT 5');
    });

    it('appends rather than wrapping, so duplicate column names still work', () => {
      /*
        `SELECT * FROM (<query>) t LIMIT 200` is the tidier way to bound a result and is
        wrong here: half these queries join borrowers to loans and select `name` from both,
        and a subquery with two columns called `name` will not run.
      */
      const r = ok('SELECT b.name, l.status FROM borrowers b JOIN loans l ON true');
      expect(r.ok && r.sql).toMatch(/^SELECT b\.name/);
      expect(r.ok && r.sql).toMatch(/LIMIT 500$/);
    });

    it('drops a trailing semicolon rather than refusing over it', () => {
      // Models end statements with one out of habit; that is not a second query.
      const r = ok('SELECT 1;');
      expect(r.ok).toBe(true);
    });
  });

  it('refuses an empty query', () => {
    refused('');
    refused('   ');
  });
});
