/**
 * Reallocates each loan's received money across its instalments in order, then derives
 * instalment and loan status from that allocation.
 *
 *   npx tsx --env-file=.env.prod scripts/repair-payment-allocation.ts            (dry run)
 *   npx tsx --env-file=.env.prod scripts/repair-payment-allocation.ts --write
 *
 * Why this is needed: the seed attached each month's receipt to the instalment whose due
 * month matched, and set the loan to completed when the *money* total reached the amount
 * repayable. Those two rules disagree — a borrower who cleared ₹18,750 in four larger
 * payments ended up with a loan marked completed but only 4 of 5 instalments paid, showing
 * "Completed" beside an overdue instalment and 101% progress.
 *
 * Repayments apply to the earliest outstanding instalment, so allocating in order makes
 * instalment status, the paid count, the loan status and the percentage all agree.
 * Receipt dates are preserved: each instalment takes the date of the receipt that cleared
 * it, so monthly cash flow (and the capital ledger built from it) stays intact.
 */
import { eq, asc } from 'drizzle-orm';
import { db } from '../src/server/db';
import { loans, payments } from '../src/server/db/schema';

const WRITE = process.argv.includes('--write');
const money = (n: number) => n.toFixed(2);

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function main() {
  console.log(WRITE ? '=== WRITING ===' : '=== DRY RUN — nothing will be written ===\n');

  const all = await db.select({
    id: loans.id, loanNumber: loans.loanNumber, status: loans.status,
    totalRepayment: loans.totalRepayment, notes: loans.notes,
  }).from(loans);

  let touchedLoans = 0, touchedRows = 0, statusFixed = 0, overpaid = 0;
  const todayStr = today();

  for (const loan of all) {
    const rows = await db.select({
      id: payments.id, installmentNumber: payments.installmentNumber,
      dueDate: payments.dueDate, amountDue: payments.amountDue,
      amountPaid: payments.amountPaid, paidDate: payments.paidDate, status: payments.status,
    }).from(payments).where(eq(payments.loanId, loan.id)).orderBy(asc(payments.installmentNumber));

    if (!rows.length) continue;

    // Receipts in the order the money arrived, so a date can follow the money.
    const receipts = rows
      .filter((r) => parseFloat(r.amountPaid) > 0)
      .map((r) => ({ amount: parseFloat(r.amountPaid), date: r.paidDate ?? r.dueDate }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));

    const received = receipts.reduce((s, r) => s + r.amount, 0);
    if (received === 0) continue;

    // Walk the instalments, drawing down the receipts in order.
    let pool = received;
    let cursor = 0;
    const desired = rows.map((r) => {
      const due = parseFloat(r.amountDue);
      const take = Math.min(pool, due);
      pool -= take;
      // The receipt that cleared (or last touched) this instalment dates it.
      let date: string | null = null;
      if (take > 0) {
        let remaining = take;
        while (remaining > 0.005 && cursor < receipts.length) {
          date = receipts[cursor].date;
          if (receipts[cursor].amount > remaining) {
            receipts[cursor].amount -= remaining;
            remaining = 0;
          } else {
            remaining -= receipts[cursor].amount;
            cursor++;
          }
        }
      }
      const status = take >= due - 0.01 ? 'paid' : take > 0 ? 'partial'
        : r.dueDate <= todayStr ? 'overdue' : 'pending';
      return { id: r.id, amountPaid: take, paidDate: take > 0 ? date : null, status };
    });

    // Money beyond the amount repayable is real money the borrower handed over, so it
    // stays on the final instalment rather than being discarded. The loan still reads
    // "5 of 5 paid"; the progress bars are capped at 100% for exactly this case.
    const excess = pool;
    if (excess > 0.01) {
      overpaid++;
      const last = desired[desired.length - 1];
      last.amountPaid += excess;
      last.paidDate ??= receipts[receipts.length - 1]?.date ?? null;
    }

    const changed = desired.filter((d, i) =>
      Math.abs(parseFloat(rows[i].amountPaid) - d.amountPaid) > 0.01
      || rows[i].status !== d.status
      || (rows[i].paidDate ?? null) !== d.paidDate);

    const allSettled = desired.every((d) => d.status === 'paid');
    const newStatus = allSettled ? 'completed' as const : 'active' as const;
    const statusWrong = loan.status !== newStatus && loan.status !== 'defaulted';

    if (!changed.length && !statusWrong) continue;
    touchedLoans++;
    touchedRows += changed.length;
    if (statusWrong) statusFixed++;

    if (!WRITE) continue;

    for (const d of changed.map((c) => desired.find((x) => x.id === c.id)!)) {
      await db.update(payments).set({
        amountPaid: money(d.amountPaid),
        paidDate: d.paidDate,
        status: d.status as 'paid' | 'partial' | 'pending' | 'overdue',
        updatedAt: new Date(),
      }).where(eq(payments.id, d.id));
    }

    if (statusWrong) {
      const note = excess > 0.01
        ? `${loan.notes ?? ''} Received ${money(excess)} beyond the amount repayable — review.`.trim()
        : loan.notes;
      await db.update(loans).set({ status: newStatus, notes: note, updatedAt: new Date() })
        .where(eq(loans.id, loan.id));
    } else if (excess > 0.01 && !(loan.notes ?? '').includes('beyond the amount repayable')) {
      await db.update(loans).set({
        notes: `${loan.notes ?? ''} Received ${money(excess)} beyond the amount repayable — review.`.trim(),
        updatedAt: new Date(),
      }).where(eq(loans.id, loan.id));
    }
  }

  console.log(`loans needing repair     : ${touchedLoans} of ${all.length}`);
  console.log(`instalment rows changed  : ${touchedRows}`);
  console.log(`loan statuses corrected  : ${statusFixed}`);
  console.log(`loans with excess received: ${overpaid}`);
  console.log(WRITE ? '\nDone.' : '\nDry run complete. Re-run with --write to apply.');
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
