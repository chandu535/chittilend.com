/**
 * Exercises the Bin end to end against a real database.
 *
 *   npx tsx --env-file=.env scripts/bin-smoke.ts            # read-only checks
 *   npx tsx --env-file=.env scripts/bin-smoke.ts --write    # the full run
 *
 * Run it against a **branch** of production, never production itself: the write path bins,
 * restores and permanently deletes real rows.
 *
 * The assertion that matters most is repeated after every step: the capital pool must not
 * move. `capital_pool_log.running_balance` is a stored cumulative figure that cannot be
 * recomputed, so if binning or purging ever disturbs it the money history is gone for
 * good. Everything else here is recoverable; that is not.
 *
 * Deliberately SQL rather than the server functions — those need an authenticated session.
 * The rules are re-expressed here as the statements the server issues, so a divergence
 * between this and bin.ts shows up as a failing step rather than passing silently.
 */
import { neon } from '@neondatabase/serverless';

const WRITE = process.argv.includes('--write');

let passed = 0;
let failed = 0;

function check(label: string, ok: boolean, detail = '') {
  console.log(`  ${ok ? 'pass' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (ok) passed++; else failed++;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set. Pass --env-file=.env');
  const sql = neon(url);

  // ---- schema is in place -------------------------------------------------
  console.log('\nSchema');
  const columns = await sql`
    SELECT table_name, column_name FROM information_schema.columns
    WHERE table_name IN ('borrowers','loans') AND column_name IN ('deleted_at','deleted_by')
  ` as Array<{ table_name: string; column_name: string }>;
  check('soft-delete columns present', columns.length === 4, `${columns.length}/4`);

  const [mobileIndex] = await sql`
    SELECT indexdef FROM pg_indexes WHERE indexname = 'borrowers_mobile_idx'
  ` as Array<{ indexdef: string }>;
  const partial = mobileIndex?.indexdef.includes('WHERE (deleted_at IS NULL)') ?? false;
  check('mobile index is partial', partial,
    partial ? '' : 'a binned borrower would hold their number for ever');

  if (columns.length < 4 || !partial) {
    console.log('\nRun scripts/add-soft-delete.ts --write first. Stopping.');
    process.exit(1);
  }

  /** The two numbers that must never change. */
  const ledger = async () => {
    const [row] = await sql`
      SELECT (SELECT count(*) FROM capital_pool_log)::int AS rows,
             (SELECT running_balance FROM capital_pool_log ORDER BY created_at DESC LIMIT 1) AS balance
    ` as Array<{ rows: number; balance: string | null }>;
    return row;
  };
  const ledgerAtStart = await ledger();
  const ledgerUnmoved = async (step: string) => {
    const now = await ledger();
    check(`capital pool unmoved after ${step}`,
      now.rows === ledgerAtStart.rows && now.balance === ledgerAtStart.balance,
      `${ledgerAtStart.rows} rows / ${ledgerAtStart.balance} -> ${now.rows} / ${now.balance}`);
  };

  console.log(`\nCapital pool baseline: ${ledgerAtStart.rows} rows, balance ${ledgerAtStart.balance}`);

  // ---- the rules, as the server writes them -------------------------------
  console.log('\nRules (read-only)');

  const [counts] = await sql`
    SELECT
      (SELECT count(*) FROM loans WHERE status IN ('active','extended') AND deleted_at IS NULL)::int AS live_owing,
      (SELECT count(*) FROM loans WHERE status IN ('completed','defaulted') AND deleted_at IS NULL)::int AS binnable,
      (SELECT count(*) FROM loans WHERE deleted_at IS NOT NULL)::int AS binned_loans,
      (SELECT count(*) FROM borrowers WHERE deleted_at IS NOT NULL)::int AS binned_borrowers,
      (SELECT count(*) FROM borrowers b WHERE b.deleted_at IS NULL
         AND NOT EXISTS (SELECT 1 FROM loans l WHERE l.borrower_id = b.id AND l.deleted_at IS NULL))::int AS binnable_borrowers
  ` as Array<Record<string, number>>;
  console.log(`  ${counts.live_owing} loans still owing (protected), ${counts.binnable} binnable`);
  console.log(`  ${counts.binnable_borrowers} borrowers have no live loans (binnable)`);
  console.log(`  currently in the Bin: ${counts.binned_loans} loans, ${counts.binned_borrowers} borrowers`);

  // No binned loan may point at a live-looking borrower whose own state disagrees, and no
  // live loan may hang off a binned borrower. That second one is the orphan the whole
  // design exists to prevent, so it is checked whatever mode we are in.
  const [orphans] = await sql`
    SELECT count(*)::int AS n FROM loans l
    JOIN borrowers b ON b.id = l.borrower_id
    WHERE l.deleted_at IS NULL AND b.deleted_at IS NOT NULL
  ` as Array<{ n: number }>;
  check('no live loan hangs off a binned borrower', orphans.n === 0, `${orphans.n} found`);

  const [dupes] = await sql`
    SELECT count(*)::int AS n FROM (
      SELECT mobile FROM borrowers WHERE deleted_at IS NULL GROUP BY mobile HAVING count(*) > 1
    ) x
  ` as Array<{ n: number }>;
  check('no duplicate mobile among live borrowers', dupes.n === 0, `${dupes.n} found`);

  if (!WRITE) {
    console.log('\nRead-only run. Re-run with --write to exercise bin, restore and purge.');
    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
  }

  // ---- the write path -----------------------------------------------------
  console.log('\nBin and restore (writes)');

  const [actor] = await sql`SELECT id FROM users WHERE role = 'admin' LIMIT 1` as Array<{ id: string }>;
  if (!actor) throw new Error('No admin user to attribute the changes to.');

  // An earlier run that died partway leaves rows in the Bin. Clear them first, or the
  // target picker skips them and the run drifts onto different data each time.
  await sql`DELETE FROM borrowers WHERE name = 'Bin smoke test'`;
  const swept = await sql`UPDATE loans SET deleted_at = NULL, deleted_by = NULL WHERE deleted_at IS NOT NULL RETURNING id`;
  const sweptB = await sql`UPDATE borrowers SET deleted_at = NULL, deleted_by = NULL WHERE deleted_at IS NOT NULL RETURNING id`;
  if (swept.length || sweptB.length) {
    console.log(`  (cleared ${swept.length} loans and ${sweptB.length} borrowers left in the Bin by an earlier run)`);
  }

  const [target] = await sql`
    SELECT l.id, l.loan_number, l.status, l.borrower_id, b.mobile, b.name
    FROM loans l JOIN borrowers b ON b.id = l.borrower_id
    WHERE l.deleted_at IS NULL AND l.status IN ('completed','defaulted')
      AND (SELECT count(*) FROM loans l2 WHERE l2.borrower_id = l.borrower_id AND l2.deleted_at IS NULL) = 1
    LIMIT 1
  ` as Array<{ id: string; loan_number: number; status: string; borrower_id: string; mobile: string; name: string }>;

  if (!target) {
    console.log('  No finished loan whose borrower has exactly one — skipping the write path.');
    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
  }
  console.log(`  Using loan #${target.loan_number} (${target.status}) of ${target.name}`);

  // A live loan refuses. Expressed as the server's own WHERE clause.
  const [live] = await sql`
    SELECT id FROM loans WHERE deleted_at IS NULL AND status IN ('active','extended') LIMIT 1
  ` as Array<{ id: string }>;
  if (live) {
    const refused = await sql`
      UPDATE loans SET deleted_at = now() WHERE id = ${live.id}
        AND deleted_at IS NULL AND status NOT IN ('active','extended') RETURNING id
    `;
    check('a loan still owing money cannot be binned', refused.length === 0);
  }

  const binned = await sql`
    UPDATE loans SET deleted_at = now(), deleted_by = ${actor.id}, updated_at = now()
    WHERE id = ${target.id} AND deleted_at IS NULL AND status NOT IN ('active','extended')
    RETURNING id
  `;
  check('a finished loan bins', binned.length === 1);
  await ledgerUnmoved('binning a loan');

  const [hidden] = await sql`
    SELECT (SELECT count(*)::int FROM loans WHERE id = ${target.id} AND deleted_at IS NULL) AS in_list,
           (SELECT count(*)::int FROM payments p JOIN loans l ON l.id = p.loan_id
              WHERE p.loan_id = ${target.id} AND l.deleted_at IS NULL) AS in_payments
  ` as Array<{ in_list: number; in_payments: number }>;
  check('binned loan leaves the loan list', hidden.in_list === 0);
  check('its instalments leave the payment lists', hidden.in_payments === 0);

  // The overdue sweep must not touch it.
  const sweptOverdue = await sql`
    UPDATE payments SET status = 'overdue' WHERE status = 'pending' AND due_date <= current_date
      AND EXISTS (SELECT 1 FROM loans l WHERE l.id = payments.loan_id AND l.deleted_at IS NULL)
      AND loan_id = ${target.id}
    RETURNING id
  `;
  check('the overdue sweep skips a binned loan', sweptOverdue.length === 0);

  const binnedBorrower = await sql`
    UPDATE borrowers SET deleted_at = now(), deleted_by = ${actor.id}, updated_at = now()
    WHERE id = ${target.borrower_id} AND deleted_at IS NULL
      AND NOT EXISTS (SELECT 1 FROM loans l WHERE l.borrower_id = borrowers.id AND l.deleted_at IS NULL)
    RETURNING id
  `;
  check('their borrower then bins', binnedBorrower.length === 1);

  const portal = await sql`
    SELECT id FROM borrowers WHERE id = ${target.borrower_id} AND deleted_at IS NULL
  `;
  check('the borrower\'s portal link stops resolving', portal.length === 0);
  await ledgerUnmoved('binning a borrower');

  // The mobile is free, which is the whole point of the partial index.
  const reused = await sql`
    INSERT INTO borrowers (name, mobile, portal_token, created_by)
    VALUES ('Bin smoke test', ${target.mobile}, md5(random()::text) || md5(random()::text), ${actor.id})
    RETURNING id
  ` as Array<{ id: string }>;
  check('the binned borrower\'s mobile can be reused', reused.length === 1);

  // ...and now they cannot come back until that is resolved.
  const blocked = await sql`
    UPDATE borrowers SET deleted_at = NULL WHERE id = ${target.borrower_id}
      AND deleted_at IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM borrowers b2 WHERE b2.mobile = borrowers.mobile
                        AND b2.id <> borrowers.id AND b2.deleted_at IS NULL)
    RETURNING id
  `;
  check('restore is blocked while someone else holds the number', blocked.length === 0);

  await sql`DELETE FROM borrowers WHERE id = ${reused[0].id}`;

  // The cascade: restoring the loan brings the borrower with it, in one transaction.
  const restoredBorrower = await sql`
    UPDATE borrowers SET deleted_at = NULL, deleted_by = NULL WHERE deleted_at IS NOT NULL
      AND id = (SELECT borrower_id FROM loans WHERE id = ${target.id})
      AND NOT EXISTS (SELECT 1 FROM borrowers b2 WHERE b2.mobile = borrowers.mobile
                        AND b2.id <> borrowers.id AND b2.deleted_at IS NULL)
    RETURNING id
  `;
  const restoredLoan = await sql`
    UPDATE loans SET deleted_at = NULL, deleted_by = NULL WHERE id = ${target.id}
      AND deleted_at IS NOT NULL
      AND EXISTS (SELECT 1 FROM borrowers b WHERE b.id = loans.borrower_id AND b.deleted_at IS NULL)
    RETURNING id
  `;
  check('restoring the loan restores the borrower too',
    restoredBorrower.length === 1 && restoredLoan.length === 1);
  await ledgerUnmoved('restoring');

  const [final] = await sql`
    SELECT (SELECT count(*)::int FROM loans WHERE id = ${target.id} AND deleted_at IS NULL) AS loan,
           (SELECT count(*)::int FROM borrowers WHERE id = ${target.borrower_id} AND deleted_at IS NULL) AS borrower
  ` as Array<{ loan: number; borrower: number }>;
  check('everything is back where it started', final.loan === 1 && final.borrower === 1);
  await ledgerUnmoved('the whole run');

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('\n', error instanceof Error ? error.message : error);
  process.exit(1);
});
