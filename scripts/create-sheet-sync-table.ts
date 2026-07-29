/**
 * Creates `sheet_sync_state` on whichever database the loaded env file names.
 *
 *   npx tsx --env-file=.env      scripts/create-sheet-sync-table.ts
 *   npx tsx --env-file=.env.prod scripts/create-sheet-sync-table.ts
 *
 * Written by hand rather than left to `drizzle-kit push`, and that is not fussiness.
 * `loans.loan_number` defaults to `nextval('loans_loan_number_seq')`, but the sequence is
 * not declared in schema.ts — so push sees an object it does not know about and tries to
 * DROP it. On dev it failed at exactly that statement and left everything intact; against
 * production it would take the loan numbering with it.
 *
 * Idempotent, and additive only. It creates one table and touches nothing else.
 */
import { sql, type SQL } from 'drizzle-orm';
import { db } from '../src/server/db';

/**
 * neon-http hands back a result object with the rows under `.rows`, not an array. Unwrapped
 * in one place so a caller cannot half-remember which it was.
 */
async function query<T>(statement: SQL): Promise<T[]> {
  const result = await db.execute(statement);
  return ((result as unknown as { rows?: T[] }).rows ?? []) as T[];
}

const DDL = sql`
  CREATE TABLE IF NOT EXISTS sheet_sync_state (
    id                 varchar(32) PRIMARY KEY,
    dirty_at           timestamptz,
    sync_started_at    timestamptz,
    synced_at          timestamptz,
    last_error         text,
    last_duration_ms   integer,
    last_loan_rows     integer,
    last_borrower_rows integer,
    updated_at         timestamptz NOT NULL DEFAULT now()
  )
`;

async function main() {
  const host = new URL(process.env.DATABASE_URL!).host;
  console.log(`database: ${host}\n`);

  const [before] = await query<{ exists: boolean }>(sql`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'sheet_sync_state'
    ) AS exists
  `);

  if (before.exists) {
    console.log('sheet_sync_state already exists — nothing to do.');
  } else {
    await db.execute(DDL);
    console.log('✓ created sheet_sync_state');
  }

  const columns = await query<{ column_name: string; data_type: string }>(sql`
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_name = 'sheet_sync_state' ORDER BY ordinal_position
  `);
  console.log(`\n${columns.length} columns:`);
  for (const column of columns) console.log(`  ${column.column_name.padEnd(20)} ${column.data_type}`);

  // Proof that nothing else moved. The sequence is the one this script exists to protect.
  const [seq] = await query<{ present: boolean }>(sql`
    SELECT EXISTS (
      SELECT 1 FROM pg_sequences WHERE sequencename = 'loans_loan_number_seq'
    ) AS present
  `);
  console.log(`\nloans_loan_number_seq still present: ${seq.present}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
