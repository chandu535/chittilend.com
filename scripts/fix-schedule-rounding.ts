/**
 * Makes every loan's schedule sum to exactly the amount repayable.
 *
 *   npx tsx --env-file=.env.prod scripts/fix-schedule-rounding.ts            (dry run)
 *   npx tsx --env-file=.env.prod scripts/fix-schedule-rounding.ts --write
 *
 * The seeder split the repayable amount evenly across the instalments, so Rs 25,000 over
 * six months became 6 x 4166.67 = 25,000.02. The final instalment then received only what
 * was left of the money and read "partial" two paise short, leaving ten loans that were
 * fully repaid still showing as active.
 *
 * The last instalment now absorbs the difference, exactly as generatePaymentSchedule does
 * for loans created in the app, and each affected row's status is re-derived from it. No
 * money moves — only what the final instalment is owed.
 */
import { eq, asc, sql } from 'drizzle-orm';
import { db } from '../src/server/db';
import { loans, payments } from '../src/server/db/schema';

const WRITE = process.argv.includes('--write');

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function main() {
  console.log(WRITE ? '=== WRITING ===\n' : '=== DRY RUN — nothing will be written ===\n');
  const todayStr = today();

  const drifted = await db
    .select({ id: loans.id, loanNumber: loans.loanNumber, status: loans.status, totalRepayment: loans.totalRepayment })
    .from(loans)
    .where(sql`(SELECT SUM(amount_due) FROM payments WHERE loan_id = ${loans.id}) <> ${loans.totalRepayment}`)
    .orderBy(asc(loans.loanNumber));

  console.log(`loans whose schedule does not sum exactly to the amount repayable: ${drifted.length}\n`);

  let rowsFixed = 0, statusesFixed = 0;

  for (const loan of drifted) {
    const rows = await db.select({
      id: payments.id, n: payments.installmentNumber, dueDate: payments.dueDate,
      amountDue: payments.amountDue, amountPaid: payments.amountPaid, status: payments.status,
    }).from(payments).where(eq(payments.loanId, loan.id)).orderBy(asc(payments.installmentNumber));
    if (!rows.length) continue;

    const repayable = parseFloat(loan.totalRepayment);
    const scheduled = rows.reduce((s, r) => s + parseFloat(r.amountDue), 0);
    const drift = scheduled - repayable;

    const last = rows[rows.length - 1];
    const newDue = parseFloat(last.amountDue) - drift;
    const paid = parseFloat(last.amountPaid);
    const newStatus = last.status === 'waived' ? 'waived'
      : paid >= newDue - 0.01 ? 'paid'
      : paid > 0 ? 'partial'
      : last.dueDate <= todayStr ? 'overdue' : 'pending';

    // A loan is settled by the amount handed over, whatever the instalments say.
    const settled = rows.reduce((s, r) =>
      s + (r.status === 'waived' ? parseFloat(r.amountDue) : parseFloat(r.amountPaid)), 0);
    const target = settled >= repayable - 0.01 ? 'completed' as const : 'active' as const;
    const statusChanges = loan.status !== target && loan.status !== 'defaulted';

    rowsFixed++;
    if (statusChanges) statusesFixed++;
    console.log(`  #${String(loan.loanNumber).padEnd(5)} drift ${drift.toFixed(2)} — final instalment ${last.amountDue} -> ${newDue.toFixed(2)}, ${last.status} -> ${newStatus}` +
      (statusChanges ? `, loan ${loan.status} -> ${target}` : ''));

    if (!WRITE) continue;

    await db.update(payments).set({
      amountDue: newDue.toFixed(2),
      status: newStatus as 'paid' | 'partial' | 'pending' | 'overdue' | 'waived',
      updatedAt: new Date(),
    }).where(eq(payments.id, last.id));

    if (statusChanges) {
      await db.update(loans).set({ status: target, updatedAt: new Date() }).where(eq(loans.id, loan.id));
    }
  }

  console.log(`\nfinal instalments adjusted : ${rowsFixed}`);
  console.log(`loan statuses corrected    : ${statusesFixed}`);
  console.log(WRITE ? '\nDone.' : '\nDry run complete. Re-run with --write to apply.');
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
