/**
 * Restores money that the first pass of repair-payment-allocation.ts discarded.
 *
 *   npx tsx --env-file=.env.prod scripts/restore-overpayments.ts            (dry run)
 *   npx tsx --env-file=.env.prod scripts/restore-overpayments.ts --write
 *
 * That pass capped every instalment at its due amount, so for the handful of loans where
 * the sheet records more collected than the loan is worth, the surplus vanished from the
 * database. This compares each loan's collected total against the source ledger and puts
 * any shortfall back on the final instalment, where it is visible rather than lost.
 *
 * The repair script now absorbs the excess itself, so this is a one-time correction.
 */
import { readFileSync } from 'node:fs';
import { eq, asc } from 'drizzle-orm';
import { db } from '../src/server/db';
import { loans, payments } from '../src/server/db/schema';

const WRITE = process.argv.includes('--write');
const money = (n: number) => n.toFixed(2);

async function main() {
  console.log(WRITE ? '=== WRITING ===\n' : '=== DRY RUN — nothing will be written ===\n');

  const src = JSON.parse(readFileSync('.extract/ledger.json', 'utf8'));
  const collectedBySerial = new Map<string, number>();
  for (const l of src.loans) {
    if (!l.dateGiven || !l.totalRepayment || !l.primaryAmount) continue;
    collectedBySerial.set(String(l.displaySerial ?? l.serial), l.totalPaid);
  }

  const all = await db.select({
    id: loans.id, loanNumber: loans.loanNumber, notes: loans.notes,
  }).from(loans);

  let fixed = 0;
  let restored = 0;

  for (const loan of all) {
    const expected = collectedBySerial.get(String(loan.loanNumber));
    if (expected === undefined) continue;

    const rows = await db.select({
      id: payments.id, amountDue: payments.amountDue, amountPaid: payments.amountPaid,
      paidDate: payments.paidDate, dueDate: payments.dueDate, status: payments.status,
    }).from(payments).where(eq(payments.loanId, loan.id)).orderBy(asc(payments.installmentNumber));
    if (!rows.length) continue;

    const actual = rows.reduce((s, r) => s + parseFloat(r.amountPaid), 0);
    const short = expected - actual;
    if (short <= 0.01) continue;

    const last = rows[rows.length - 1];
    const newPaid = parseFloat(last.amountPaid) + short;
    const lastDated = [...rows].reverse().find((r) => r.paidDate)?.paidDate ?? last.dueDate;

    console.log(`#${loan.loanNumber}: collected ${expected}, database had ${actual} — restoring ${short.toFixed(0)} onto the final instalment (${last.amountDue} due, now ${newPaid.toFixed(0)} paid)`);
    fixed++;
    restored += short;
    if (!WRITE) continue;

    await db.update(payments).set({
      amountPaid: money(newPaid),
      paidDate: last.paidDate ?? lastDated,
      status: 'paid',
      paymentMethod: 'cash',
      updatedAt: new Date(),
    }).where(eq(payments.id, last.id));

    const marker = 'beyond the amount repayable';
    if (!(loan.notes ?? '').includes(marker)) {
      await db.update(loans).set({
        notes: `${loan.notes ?? ''} Received ${money(short)} ${marker} — review.`.trim(),
        updatedAt: new Date(),
      }).where(eq(loans.id, loan.id));
    }
  }

  console.log(`\nloans corrected : ${fixed}`);
  console.log(`money restored  : Rs ${restored.toFixed(0)}`);
  console.log(WRITE ? '\nDone.' : '\nDry run complete. Re-run with --write to apply.');
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
