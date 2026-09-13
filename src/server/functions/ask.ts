import { createServerFn } from '@tanstack/react-start';
import { sql } from 'drizzle-orm';
import { db } from '../db';
import { getAuthenticatedUser } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';
import { askModel, extractSql, ModelUnavailable } from '../ai/groq';
import { guardSql } from '../ai/sqlGuard';
import { SCHEMA_PROMPT } from '../ai/schemaPrompt';
import { summariseRows, rowSentences } from '../ai/summarise';

/**
 * Asking the ledger a question in words.
 *
 * Three steps, and only the middle one touches the database: the model turns the question
 * into a query, the query is checked and run, and the model turns the rows back into a
 * sentence. It never sees the ledger and never produces a number — every figure on the
 * screen came out of Postgres, which is the only reason any of this is trustworthy.
 *
 * The query it wrote is returned alongside the answer, and shown. A generated query can be
 * valid, safe, and quietly answer a slightly different question than the one asked — that is
 * this feature's real failure mode, not anything dramatic — and the only defence against it
 * is that somebody can read what actually ran.
 *
 * Dev only for now. Pointing this at production needs the read-only Postgres role first:
 * SELECT granted on the business tables, nothing granted on users or sessions. The check in
 * sqlGuard.ts is standing in for permissions the database should be enforcing itself.
 */

/**
 * A value as it comes back over the wire. Postgres numerics arrive as strings, which is
 * wanted here — nothing rounds them on the way to the screen.
 */
export type Cell = string | number | boolean | null;
export type Row = Record<string, Cell>;

export interface AskResult {
  answer: string;
  /** Column order as returned, so the table renders the way the query asked for it. */
  columns: string[];
  rows: Row[];
  /**
   * The rows as spoken lines, one per person.
   *
   * Sent alongside the table because the table is useless to the reader this is for. A
   * question about who has not paid is answered by the names, and a count of them is not
   * an answer to anyone who cannot read the screen.
   */
  lines: string[];
  /** Shown to the user. The point is that it can be checked. */
  sql: string | null;
  error: string | null;
}

const REFUSAL = 'CANNOT_ANSWER';

export const askLedger = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const d = data as { question?: string };
    const question = (d.question ?? '').trim();
    if (!question) throw new Error('Ask a question first');
    if (question.length > 500) throw new Error('That question is too long');
    return { question };
  })
  .handler(async ({ data }): Promise<AskResult> => {
    const user = await getAuthenticatedUser();
    // Read-only, but it reads the whole book — the same bar as seeing the loans list.
    requireRole(user, ['admin', 'manager']);

    const empty = { answer: '', columns: [], rows: [], lines: [], sql: null };

    let generated: string;
    try {
      generated = extractSql(await askModel({
        system: SCHEMA_PROMPT,
        user: data.question,
        temperature: 0,
      }));
    } catch (err) {
      return {
        ...empty,
        error: err instanceof ModelUnavailable ? err.message : 'Could not reach the model',
      };
    }

    if (generated.toUpperCase().includes(REFUSAL)) {
      return { ...empty, error: 'That cannot be answered from the ledger' };
    }

    const guarded = guardSql(generated);
    if (!guarded.ok) {
      // The rejected query is still shown: a refusal the user cannot see is indistinguishable
      // from a bug, and this one is usually the model misreading the question.
      return { ...empty, sql: generated, error: guarded.reason };
    }

    let rows: Row[];
    try {
      const result = await db.execute(sql.raw(guarded.sql));
      rows = (result as unknown as { rows: Row[] }).rows ?? [];
    } catch (err) {
      // Almost always a column the model invented. Worth showing plainly rather than
      // dressing up, because the query above it is the explanation.
      return {
        ...empty,
        sql: guarded.sql,
        error: err instanceof Error ? err.message.split('\n')[0] : 'That query did not run',
      };
    }

    const columns = rows.length ? Object.keys(rows[0]) : [];

    return {
      answer: summariseRows(rows),
      columns,
      rows,
      lines: rowSentences(rows),
      sql: guarded.sql,
      error: null,
    };
  });
