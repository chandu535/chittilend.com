/**
 * Removes instalment rows that were never part of a loan's schedule.
 *
 *   npx tsx --env-file=.env.prod scripts/repair-phantom-instalments.ts            (dry run)
 *   npx tsx --env-file=.env.prod scripts/repair-phantom-instalments.ts --write
 *
 * The first seeder attached each receipt to the instalment whose due month matched, and
 * appended any receipt landing outside those months as an extra instalment row carrying
 * `amount_due` equal to the receipt. That turned a *payment* into a *debt*: loan #16 has
 * five instalments of ₹2,500 and a sixth row for ₹3,000 the borrower never owed, created
 * out of a September receipt the five-month schedule had no slot for.
 *
 * Once repair-payment-allocation.ts spread the money across instalments in order, the
 * real five absorbed all of it and the appended row was left unpaid — so 48 loans that
 * are fully repaid still read "active" with an overdue instalment, and the reminder cron
 * would chase 39 people for money they do not owe.
 *
 * This deletes rows beyond the loan's own instalment count and reallocates the loan's
 * money across the real schedule, so every rupee stays on the books and the phantom debt
 * disappears. The seeder no longer creates these rows.
 */
import { eq, asc, sql } from 'drizzle-orm';
import { db } from '../src/server/db';
import { loans, payments, capitalPoolLog } from '../src/server/db/schema';

const WRITE = process.argv.includes('--write');
const money = (n: number) => n.toFixed(2);
const rupees = (n: number) => 'Rs ' + Math.round(n).toLocaleString('en-IN');

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function main() {
  console.log(WRITE ? '=== WRITING ===\n' : '=== DRY RUN — nothing will be written ===\n');
  const todayStr = today();

  const affected = await db
    .select({ id: loans.id, loanNumber: loans.loanNumber, status: loans.status, totalInstallments: loans.totalInstallments })
    .from(loans)
    .where(sql`(SELECT count(*) FROM payments WHERE loan_id = ${loans.id}) > ${loans.totalInstallments}`)
    .orderBy(asc(loans.loanNumber));

  console.log(`loans carrying rows beyond their own instalment count: ${affected.length}\n`);

  let deleted = 0, moneyMoved = 0, reopened = 0, rowsChanged = 0;

  for (const loan of affected) {
    const rows = await db.select({
      id: payments.id, n: payments.installmentNumber, dueDate: payments.dueDate,
      amountDue: payments.amountDue, amountPaid: payments.amountPaid,
      paidDate: payments.paidDate, status: payments.status,
    }).from(payments).where(eq(payments.loanId, loan.id)).orderBy(asc(payments.installmentNumber));

    const real = rows.filter((r) => r.n <= loan.totalInstallments);
    const phantom = rows.filter((r) => r.n > loan.totalInstallments);
    if (!phantom.length) continue;

    // Every rupee on the loan, including anything sitting on a row about to be removed.
    const collected = rows.reduce((s, r) => s + parseFloat(r.amountPaid), 0);
    const carried = phantom.reduce((s, r) => s + parseFloat(r.amountPaid), 0);
    const receipts = rows
      .filter((r) => parseFloat(r.amountPaid) > 0)
      .map((r) => ({ amount: parseFloat(r.amountPaid), date: r.paidDate ?? r.dueDate }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));

    // Same allocation the seeder and the app use: earliest instalment first.
    let pool = collected;
    let cursor = 0;
    const desired = real.map((r) => {
      const due = parseFloat(r.amountDue);
      const take = Math.min(pool, due);
      pool -= take;
      let date: string | null = null;
      if (take > 0) {
        let remaining = take;
        while (remaining > 0.005 && cursor < receipts.length) {
          date = receipts[cursor].date;
          if (receipts[cursor].amount > remaining) { receipts[cursor].amount -= remaining; remaining = 0; }
          else { remaining -= receipts[cursor].amount; cursor++; }
        }
      }
      const status = take >= due - 0.01 ? 'paid' : take > 0 ? 'partial'
        : r.dueDate <= todayStr ? 'overdue' : 'pending';
      return { id: r.id, amountPaid: take, paidDate: take > 0 ? date : null, status };
    });

    if (pool > 0.01 && desired.length) {
      const last = desired[desired.length - 1];
      last.amountPaid += pool;
      last.paidDate ??= receipts[receipts.length - 1]?.date ?? null;
    }

    const allSettled = desired.every((d) => d.status === 'paid');
    const newStatus = allSettled ? 'completed' as const : 'active' as const;
    const statusChanges = loan.status !== newStatus && loan.status !== 'defaulted';

    deleted += phantom.length;
    moneyMoved += carried;
    if (statusChanges) reopened++;

    const changedRows = desired.filter((d, i) =>
      Math.abs(parseFloat(real[i].amountPaid) - d.amountPaid) > 0.01 || real[i].status !== d.status);
    rowsChanged += changedRows.length;

    console.log(`  #${String(loan.loanNumber).padEnd(5)} removing ${phantom.length} row(s) claiming ${rupees(phantom.reduce((s, r) => s + parseFloat(r.amountDue), 0))}` +
      (carried > 0.01 ? `, moving ${rupees(carried)} back onto the schedule` : '') +
      (statusChanges ? `  ${loan.status} -> ${newStatus}` : ''));

    if (!WRITE) continue;

    // The capital pool has a collection entry against each of these rows. That money was
    // genuinely collected and stays in the pool — only the pointer to a row about to
    // disappear is cleared, and the loan reference is kept so the entry stays traceable.
    for (const p of phantom) {
      await db.update(capitalPoolLog)
        .set({ referencePaymentId: null })
        .where(eq(capitalPoolLog.referencePaymentId, p.id));
    }
    for (const p of phantom) await db.delete(payments).where(eq(payments.id, p.id));
    for (const d of desired) {
      await db.update(payments).set({
        amountPaid: money(d.amountPaid),
        paidDate: d.paidDate,
        status: d.status as 'paid' | 'partial' | 'pending' | 'overdue',
        updatedAt: new Date(),
      }).where(eq(payments.id, d.id));
    }
    if (statusChanges) {
      await db.update(loans).set({ status: newStatus, updatedAt: new Date() }).where(eq(loans.id, loan.id));
    }
  }

  console.log(`\nphantom rows removed        : ${deleted}`);
  console.log(`money moved back onto real instalments : ${rupees(moneyMoved)}`);
  console.log(`instalment rows corrected   : ${rowsChanged}`);
  console.log(`loans that become completed : ${reopened}`);
  console.log(WRITE ? '\nDone.' : '\nDry run complete. Re-run with --write to apply.');
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
