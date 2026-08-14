/**
 * Creates `collection_entries` and its two enums on whichever database the loaded env
 * file names.
 *
 *   npx tsx --env-file=.env      scripts/create-collection-entries-table.ts
 *   npx tsx --env-file=.env.prod scripts/create-collection-entries-table.ts
 *
 * Written by hand rather than left to `drizzle-kit push`, for the same reason as
 * create-sheet-sync-table.ts: `loans.loan_number` defaults to a sequence that schema.ts
 * does not declare, so push sees an object it does not know about and tries to DROP it.
 * On dev it failed at exactly that statement; against production it would take the loan
 * numbering with it.
 *
 * Idempotent, and additive only. It creates two enums, one table and three indexes, and
 * touches nothing that already exists.
 */
import { sql, type SQL } from 'drizzle-orm';
import { db } from '../src/server/db';

/**
 * neon-http hands back a result object with the rows under `.rows`, not an array.
 * Unwrapped in one place so a caller cannot half-remember which it was.
 */
async function query<T>(statement: SQL): Promise<T[]> {
  const result = await db.execute(statement);
  return ((result as unknown as { rows?: T[] }).rows ?? []) as T[];
}

/**
 * CREATE TYPE has no IF NOT EXISTS before Postgres 16, and Neon is not guaranteed to be
 * there, so each enum is guarded by a lookup in pg_type instead.
 */
const ENUMS: { name: string; values: string[] }[] = [
  { name: 'collection_kind', values: ['taken', 'given'] },
  { name: 'collection_status', values: ['pending', 'applied', 'discarded'] },
];

const DDL = sql`
  CREATE TABLE IF NOT EXISTS collection_entries (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    kind         collection_kind NOT NULL,
    borrower_id  uuid NOT NULL REFERENCES borrowers(id) ON DELETE RESTRICT,
    loan_id      uuid REFERENCES loans(id) ON DELETE SET NULL,
    amount       numeric(12, 2) NOT NULL,
    note         text,
    status       collection_status NOT NULL DEFAULT 'pending',
    recorded_by  uuid NOT NULL REFERENCES users(id),
    recorded_at  timestamptz NOT NULL DEFAULT now(),
    applied_by   uuid REFERENCES users(id),
    applied_at   timestamptz,
    last_error   text,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
  )
`;

const INDEXES = [
  sql`CREATE INDEX IF NOT EXISTS collection_entries_status_idx ON collection_entries (status, recorded_at)`,
  sql`CREATE INDEX IF NOT EXISTS collection_entries_borrower_idx ON collection_entries (borrower_id)`,
  sql`CREATE INDEX IF NOT EXISTS collection_entries_loan_idx ON collection_entries (loan_id)`,
];

async function main() {
  const host = new URL(process.env.DATABASE_URL!).host;
  console.log(`database: ${host}\n`);

  for (const { name, values } of ENUMS) {
    const [found] = await query<{ exists: boolean }>(sql`
      SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = ${name}) AS exists
    `);
    if (found.exists) {
      console.log(`enum ${name} already exists`);
      continue;
    }
    // CREATE TYPE takes no bound parameters, so the labels go in as literal text. They are
    // constants declared above rather than anything a caller supplies, and the pattern
    // check keeps it that way should someone edit the list later.
    const identifier = /^[a-z_][a-z0-9_]*$/;
    if (!identifier.test(name) || !values.every((v) => identifier.test(v))) {
      throw new Error(`Refusing to inline a non-identifier into DDL: ${name}`);
    }
    const labels = values.map((v) => `'${v}'`).join(', ');
    await db.execute(sql.raw(`CREATE TYPE ${name} AS ENUM (${labels})`));
    console.log(`✓ created enum ${name}`);
  }

  const [before] = await query<{ exists: boolean }>(sql`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'collection_entries'
    ) AS exists
  `);

  if (before.exists) {
    console.log('collection_entries already exists — nothing to do.');
  } else {
    await db.execute(DDL);
    console.log('✓ created collection_entries');
  }

  for (const index of INDEXES) await db.execute(index);
  console.log('✓ indexes present');

  const columns = await query<{ column_name: string; data_type: string }>(sql`
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_name = 'collection_entries' ORDER BY ordinal_position
  `);
  console.log(`\n${columns.length} columns:`);
  for (const column of columns) console.log(`  ${column.column_name.padEnd(14)} ${column.data_type}`);

  // Proof that nothing else moved. The sequence is the one these scripts exist to protect.
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
