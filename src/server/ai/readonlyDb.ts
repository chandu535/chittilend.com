import { neon } from '@neondatabase/serverless';

/**
 * The connection generated SQL runs on, and the reason `/ask` is safe to point at real data.
 *
 * Everything else in the app connects as the owner, which can write anything and read the
 * `users` table. A model-written query must never touch that connection — not because the
 * model is expected to misbehave, but because the only guard on the other side would be
 * sqlGuard.ts, and a check on text is a good habit rather than a boundary. Regexes have
 * blind spots; a permission the role does not hold has none.
 *
 * `ai_readonly` holds SELECT on the five business tables and nothing on `users` or
 * `sessions`, runs every transaction read-only, and gives up after five seconds. Those are
 * properties of the role, so they hold no matter what question is asked, what the model
 * writes, or what a borrower has been persuaded to type into a name field.
 *
 * Verified rather than assumed — scripts/create-ai-readonly-role.ts ends by trying to read
 * the password hashes and write to the ledger through this very connection, and refuses to
 * report success unless both are refused.
 */

let client: ReturnType<typeof neon> | null = null;

export class ReadonlyDbUnavailable extends Error {}

function connection() {
  if (client) return client;

  const url = process.env.AI_DATABASE_URL;
  if (!url) {
    throw new ReadonlyDbUnavailable(
      'The assistant has no read-only database connection configured',
    );
  }

  /*
    Refuses to start if it has been pointed at the owner's connection string.

    The failure this prevents is a quiet one: copy DATABASE_URL into AI_DATABASE_URL to
    "get it working", and everything still works — the same questions, the same answers —
    while the boundary this whole file exists for is gone, with nothing on screen to say so.
  */
  if (process.env.DATABASE_URL && url === process.env.DATABASE_URL) {
    throw new ReadonlyDbUnavailable(
      'AI_DATABASE_URL is the owner connection. It must be the read-only role.',
    );
  }

  client = neon(url);
  return client;
}

/** A value as it comes back. Postgres numerics arrive as strings, and stay that way. */
export type Cell = string | number | boolean | null;
export type Row = Record<string, Cell>;

/**
 * Runs one generated query and returns its rows.
 *
 * The query arrives already checked by sqlGuard. This is the second of the two barriers,
 * and the one that holds if the first is wrong.
 */
export async function runReadonlyQuery(query: string): Promise<Row[]> {
  const result = await connection().query(query) as unknown;
  // The driver returns a bare array for some shapes and { rows } for others.
  if (Array.isArray(result)) return result as Row[];
  return ((result as { rows?: Row[] }).rows ?? []);
}

/** True when the assistant has somewhere safe to run. Lets the screen say so plainly. */
export function readonlyDbConfigured(): boolean {
  try {
    connection();
    return true;
  } catch {
    return false;
  }
}
