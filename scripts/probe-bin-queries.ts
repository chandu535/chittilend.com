/**
 * Throwaway probe: runs the exact select shapes bin.ts uses.
 *
 *   npx tsx --env-file=.env scripts/probe-bin-queries.ts
 *
 * The correlated subqueries in db/softDelete.ts are the shape that has silently returned
 * zero in this codebase before — an interpolated ${borrowers.id} renders as a bare "id"
 * inside a single-table select, which then resolves to the wrong table. This proves they
 * actually resolve against real data rather than quietly counting nothing.
 */
import { and, desc, eq, isNotNull, isNull, sql } from 'drizzle-orm';
import { db } from '../src/server/db';
import { borrowers, loans, users } from '../src/server/db/schema';
import { liveLoanCountSql, totalLoanCountSql, mobileHolderSql, mobileFree } from '../src/server/db/softDelete';

async function main() {
  const rows = await db.select({
    id: borrowers.id, name: borrowers.name, mobile: borrowers.mobile,
    liveLoanCount: liveLoanCountSql,
    totalLoanCount: totalLoanCountSql,
    mobileHolder: mobileHolderSql,
  }).from(borrowers).limit(6);

  console.log('borrower facts:');
  for (const r of rows) {
    console.log(`  ${r.name.padEnd(20)} ${r.mobile}  live=${r.liveLoanCount} total=${r.totalLoanCount} holder=${JSON.stringify(r.mobileHolder)}`);
  }
  const anyLoans = rows.some((r) => Number(r.liveLoanCount) > 0);
  console.log(`\n  correlated loan counts resolve: ${anyLoans ? 'YES' : 'NO — they are counting nothing'}`);

  const binned = await db.select({
    id: loans.id, loanNumber: loans.loanNumber,
    deletedByName: users.name,
    borrowerName: borrowers.name,
    borrowerDeletedAt: borrowers.deletedAt,
    borrowerMobileHolder: mobileHolderSql,
  }).from(loans)
    .innerJoin(borrowers, eq(loans.borrowerId, borrowers.id))
    .leftJoin(users, eq(loans.deletedBy, users.id))
    .where(isNotNull(loans.deletedAt))
    .orderBy(desc(loans.deletedAt)).limit(5);
  console.log(`  listBinnedLoans shape executed, ${binned.length} rows`);

  // mobileFree and mobileHolderSql guard restore, and carry the same correlation trap.
  // Stage a real conflict: bin a loan-free borrower, then put a live one on their number.
  const [free] = await db.select({ id: borrowers.id, name: borrowers.name, mobile: borrowers.mobile })
    .from(borrowers)
    .where(and(isNull(borrowers.deletedAt), sql`NOT EXISTS (SELECT 1 FROM loans l WHERE l.borrower_id = borrowers.id)`))
    .limit(1);
  if (!free) { console.log('\n  no loan-free borrower to stage a conflict with'); process.exit(anyLoans ? 0 : 1); }

  const [admin] = await db.select({ id: users.id }).from(users).limit(1);
  await db.update(borrowers).set({ deletedAt: new Date(), deletedBy: admin.id }).where(eq(borrowers.id, free.id));
  const [rival] = await db.insert(borrowers).values({
    name: 'Probe rival', mobile: free.mobile,
    portalToken: 'p'.repeat(64), createdBy: admin.id,
  }).returning({ id: borrowers.id });

  const [conflicted] = await db.select({ mobileHolder: mobileHolderSql })
    .from(borrowers).where(eq(borrowers.id, free.id)).limit(1);
  console.log(`\n  mobileHolderSql sees the rival: ${JSON.stringify(conflicted.mobileHolder)}`);

  const blocked = await db.update(borrowers).set({ deletedAt: null })
    .where(and(eq(borrowers.id, free.id), isNotNull(borrowers.deletedAt), mobileFree))
    .returning({ id: borrowers.id });
  console.log(`  mobileFree blocks the restore: ${blocked.length === 0 ? 'YES' : 'NO — it let it through'}`);

  await db.delete(borrowers).where(eq(borrowers.id, rival.id));
  const freed = await db.update(borrowers).set({ deletedAt: null, deletedBy: null })
    .where(and(eq(borrowers.id, free.id), isNotNull(borrowers.deletedAt), mobileFree))
    .returning({ id: borrowers.id });
  console.log(`  and allows it once the number is free: ${freed.length === 1 ? 'YES' : 'NO'}`);

  const ok = anyLoans && conflicted.mobileHolder !== null && blocked.length === 0 && freed.length === 1;
  process.exit(ok ? 0 : 1);
}

main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
