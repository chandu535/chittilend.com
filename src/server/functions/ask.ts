import { createServerFn } from '@tanstack/react-start';
import { getAuthenticatedUser } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';
import { askModel, extractSql, ModelUnavailable } from '../ai/groq';
import { guardSql } from '../ai/sqlGuard';
import { SCHEMA_PROMPT } from '../ai/schemaPrompt';
import { summariseRows, rowSentences } from '../ai/summarise';
import { runReadonlyQuery, ReadonlyDbUnavailable, type Row } from '../ai/readonlyDb';

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
 * Two barriers, not one. sqlGuard reads the text and refuses anything that is not a single
 * SELECT; the connection it then runs on is a role that holds SELECT on five tables, nothing
 * on users or sessions, and cannot write at all. The first is a good habit. The second is
 * the one that holds when the first turns out to have a blind spot.
 */

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
  /**
   * An i18n key rather than a sentence.
   *
   * The screen is read in Telugu and these were coming back in English — "That cannot be
   * answered from the ledger" under a Telugu question, which is no message at all to the
   * person this was built for. The server does not know which language is on, so it names
   * the problem and the screen says it.
   */
  error: string | null;
  /** The raw reason, for an error no key covers — a Postgres message, usually. */
  errorDetail?: string | null;
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

    const empty = { answer: '', columns: [], rows: [], lines: [], sql: null, errorDetail: null };

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
        error: 'ask.errors.model',
        errorDetail: err instanceof ModelUnavailable ? err.message : null,
      };
    }

    if (generated.toUpperCase().includes(REFUSAL)) {
      return { ...empty, error: 'ask.errors.cannotAnswer' };
    }

    const guarded = guardSql(generated);
    if (!guarded.ok) {
      // The rejected query is still shown: a refusal the user cannot see is indistinguishable
      // from a bug, and this one is usually the model misreading the question.
      // The guard's reason is shown as detail: it names a specific refusal, and the query
      // it refused is on screen beside it.
      return { ...empty, sql: generated, error: 'ask.errors.refused', errorDetail: guarded.reason };
    }

    let rows: Row[];
    try {
      rows = await runReadonlyQuery(guarded.sql);
    } catch (err) {
      if (err instanceof ReadonlyDbUnavailable) {
        // Never falls back to the owner connection. A missing read-only role is a reason
        // to answer nothing, not a reason to run generated SQL somewhere more powerful.
        return { ...empty, sql: guarded.sql, error: 'ask.errors.noConnection' };
      }
      // Almost always a column the model invented. Worth showing plainly rather than
      // dressing up, because the query above it is the explanation.
      return {
        ...empty,
        sql: guarded.sql,
        error: 'ask.errors.queryFailed',
        errorDetail: err instanceof Error ? err.message.split('\n')[0] : null,
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
