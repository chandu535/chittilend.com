/**
 * Adds the soft-delete columns and swaps the mobile index for a partial one.
 *
 *   npx tsx --env-file=.env      scripts/add-soft-delete.ts     # inspect only
 *   npx tsx --env-file=.env      scripts/add-soft-delete.ts --write
 *   npx tsx --env-file=.env.prod scripts/add-soft-delete.ts --write
 *
 * Applied by hand rather than through `db:push` for one reason: `borrowers_mobile_idx`
 * has to become **partial**. drizzle-kit's handling of index predicates is unreliable —
 * it may silently leave the unconditional index in place, and nothing would look wrong
 * until months later when a restore failed because a binned borrower was still holding a
 * mobile number. The verification at the end is the point of this script.
 *
 * Every statement is idempotent, so a re-run after a partial failure is safe.
 *
 * Ordering matters in one place: the replacement unique index is built *before* the old
 * one is dropped, so uniqueness on mobile is never unenforced, not even momentarily. All
 * index work is CONCURRENTLY — 178 borrowers and 426 loans would lock for milliseconds,
 * but a schema change against live data should not take a write lock on principle.
 */
import { neon } from '@neondatabase/serverless';

const WRITE = process.argv.includes('--write');

const STEPS: Array<[string, string]> = [
  ['borrowers.deleted_at', 'ALTER TABLE borrowers ADD COLUMN IF NOT EXISTS deleted_at timestamptz'],
  ['borrowers.deleted_by', 'ALTER TABLE borrowers ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES users(id)'],
  ['loans.deleted_at', 'ALTER TABLE loans ADD COLUMN IF NOT EXISTS deleted_at timestamptz'],
  ['loans.deleted_by', 'ALTER TABLE loans ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES users(id)'],
  ['borrowers_deleted_at_idx', 'CREATE INDEX CONCURRENTLY IF NOT EXISTS borrowers_deleted_at_idx ON borrowers (deleted_at)'],
  ['loans_deleted_at_idx', 'CREATE INDEX CONCURRENTLY IF NOT EXISTS loans_deleted_at_idx ON loans (deleted_at)'],
  ['build partial mobile index', 'CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS borrowers_mobile_live_idx ON borrowers (mobile) WHERE deleted_at IS NULL'],
  ['drop the total one', 'DROP INDEX CONCURRENTLY IF EXISTS borrowers_mobile_idx'],
  ['rename into place', 'ALTER INDEX borrowers_mobile_live_idx RENAME TO borrowers_mobile_idx'],
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set. Pass --env-file=.env or --env-file=.env.prod');
  const sql = neon(url);

  const [before] = await sql`
    SELECT (SELECT count(*) FROM borrowers) AS borrowers, (SELECT count(*) FROM loans) AS loans
  ` as Array<{ borrowers: string; loans: string }>;
  console.log(`Database holds ${before.borrowers} borrowers, ${before.loans} loans.\n`);

  if (!WRITE) {
    console.log('Inspect only. These would run:\n');
    for (const [label, statement] of STEPS) console.log(`  ${label.padEnd(26)} ${statement}`);
    console.log('\nRe-run with --write to apply.');
  } else {
    for (const [label, statement] of STEPS) {
      try {
        // `sql.query` takes a plain string; the tagged-template form would treat the
        // statement as an interpolation and parameterise the DDL.
        await sql.query(statement);
        console.log(`  ok      ${label}`);
      } catch (error) {
        // A rename that has already happened is the one expected failure on a re-run.
        const message = error instanceof Error ? error.message : String(error);
        console.log(`  ${/does not exist/.test(message) ? 'skip    ' : 'FAILED  '}${label} — ${message}`);
      }
    }
  }

  // The verification, which is why this is a script and not a push.
  const indexes = await sql`
    SELECT indexname, indexdef FROM pg_indexes
    WHERE tablename IN ('borrowers', 'loans')
      AND (indexname LIKE '%mobile%' OR indexname LIKE '%deleted_at%')
    ORDER BY indexname
  ` as Array<{ indexname: string; indexdef: string }>;

  console.log('\n--- indexes ---');
  for (const row of indexes) console.log(`  ${row.indexname}\n    ${row.indexdef}`);

  const mobile = indexes.find((r) => r.indexname === 'borrowers_mobile_idx');
  const partial = mobile?.indexdef.includes('WHERE (deleted_at IS NULL)') ?? false;

  console.log('\n--- verdict ---');
  console.log(`  mobile index is partial : ${partial ? 'YES' : 'NO'}`);
  if (!partial && WRITE) {
    console.log('\n  The mobile index is still total. Until it is partial, a binned borrower');
    console.log('  keeps their number for ever and can never be restored or re-entered.');
    process.exitCode = 1;
  }

  const columns = await sql`
    SELECT table_name, column_name FROM information_schema.columns
    WHERE table_name IN ('borrowers', 'loans') AND column_name IN ('deleted_at', 'deleted_by')
    ORDER BY table_name, column_name
  ` as Array<{ table_name: string; column_name: string }>;
  console.log(`  soft-delete columns     : ${columns.length}/4 present`);

  // Null means live, so nothing needs backfilling — but say so rather than assume it.
  if (columns.length === 4) {
    const [live] = await sql`
      SELECT (SELECT count(*) FROM borrowers WHERE deleted_at IS NULL) AS b,
             (SELECT count(*) FROM loans WHERE deleted_at IS NULL) AS l
    ` as Array<{ b: string; l: string }>;
    console.log(`  live after the change   : ${live.b} borrowers, ${live.l} loans`);
    if (live.b !== before.borrowers || live.l !== before.loans) {
      console.log('  MISMATCH — something was marked deleted. Investigate before continuing.');
      process.exitCode = 1;
    }
  }
}

main().then(() => process.exit(process.exitCode ?? 0)).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
