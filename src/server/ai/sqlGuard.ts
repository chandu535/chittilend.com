/**
 * What a generated query is allowed to be.
 *
 * The assistant writes SQL, which is the only way it can answer a question nobody wrote a
 * function for. That is the point of it and also the whole risk, so the text is checked
 * before it reaches the database rather than trusted because a prompt asked nicely.
 *
 * This is the weaker of the two guards and knows it. The strong one is a Postgres role with
 * SELECT granted on seven tables and nothing granted on `users` or `sessions` — permissions
 * the database enforces, which no wording in a question can talk its way past. That role is
 * required before this is pointed at production. Until then this runs against the dev
 * database, and this file is what stands in for it.
 *
 * Written as refusal rather than repair: a query that looks wrong is rejected, never
 * rewritten into something safe. Sanitising by editing is how a check gets fooled — the
 * edited version is a query nobody has read.
 */

export type GuardResult =
  | {
      ok: true;
      /** What to run: the query with a row cap, so one bad join cannot pull the ledger. */
      sql: string;
      /**
       * The same query without that cap.
       *
       * A capped query gives a truthful page and an untruthful total — the caller counts and
       * adds what came back, which is only ever the first two hundred rows. Totals are taken
       * from this instead, wrapped in an aggregate, so the figures cover everything the
       * question actually matched while the screen still shows a page of it.
       */
      unbounded: string;
      /** The cap that was applied, so the caller can tell a full page from a truncated one. */
      limit: number;
    }
  | { ok: false; reason: string };

/** Anything that writes, changes structure, grants rights, or reaches outside the query. */
const FORBIDDEN = [
  'insert', 'update', 'delete', 'drop', 'alter', 'create', 'truncate', 'replace',
  'grant', 'revoke', 'copy', 'vacuum', 'analyze', 'reindex', 'cluster',
  'call', 'do', 'execute', 'prepare', 'listen', 'notify', 'lock',
  'set', 'reset', 'begin', 'commit', 'rollback', 'savepoint',
  'pg_sleep', 'pg_read_file', 'pg_write_file', 'pg_ls_dir', 'lo_import', 'lo_export',
  'dblink', 'pg_terminate_backend', 'pg_cancel_backend', 'into',
];

/**
 * Tables the assistant may never read.
 *
 * `users` holds bcrypt hashes and `sessions` holds live tokens. Neither has any bearing on a
 * question about money, and a question that reaches for them is not a question about money.
 */
const OFF_LIMITS = ['users', 'sessions', 'pg_shadow', 'pg_authid', 'pg_user', 'pg_roles'];

/**
 * How many rows come back.
 *
 * Raised from two hundred, which was quietly wrong rather than merely stingy: "who owes us
 * money" matches 256 instalments, so the answer was totalled over the first 200 and came out
 * ₹1,68,250 short with nothing on screen to say it had been cut. The cap is still needed —
 * one bad join should not pull the ledger through a phone — so the totals are taken from an
 * aggregate over the whole query instead, and this now only governs how much is displayed.
 */
const MAX_ROWS = 500;

export function guardSql(raw: string): GuardResult {
  const sql = raw.trim().replace(/;+\s*$/, '').trim();

  if (!sql) return { ok: false, reason: 'Empty query' };

  /*
    Comments are stripped before anything is judged, not merely rejected. `SELECT 1 --` and
    `/* *​/ DROP` are the standard ways to hide a second statement from a scanner that reads
    the text naively, and a keyword check that runs over un-stripped text can be walked
    straight past.
  */
  const bare = sql
    .replace(/--[^\n]*/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .toLowerCase();

  // One statement. A semicolon in the middle is a second query, whatever follows it.
  if (bare.includes(';')) return { ok: false, reason: 'Only one statement is allowed' };

  if (!/^\s*(select|with)\b/.test(bare)) {
    return { ok: false, reason: 'Only SELECT queries are allowed' };
  }

  /*
    Matched on word boundaries against the comment-stripped text. Substring matching would
    reject `selected_at` for containing "select" and, worse, miss nothing useful — the
    boundary is what makes the list precise enough to be strict.
  */
  for (const word of FORBIDDEN) {
    if (new RegExp(`\\b${word}\\b`).test(bare)) {
      return { ok: false, reason: `Not allowed in a query: ${word}` };
    }
  }

  for (const table of OFF_LIMITS) {
    if (new RegExp(`\\b${table}\\b`).test(bare)) {
      return { ok: false, reason: `That table is not readable: ${table}` };
    }
  }

  // Appended rather than wrapped in a subquery: wrapping breaks the moment two joined
  // tables both select a column called `name`, which on this schema is most queries.
  const alreadyLimited = /\blimit\s+\d+/.test(bare);
  const bounded = alreadyLimited ? sql : `${sql} LIMIT ${MAX_ROWS}`;

  return { ok: true, sql: bounded, unbounded: sql, limit: alreadyLimited ? 0 : MAX_ROWS };
}
