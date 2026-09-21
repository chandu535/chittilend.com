/**
 * Fills the #238 gap: a real loan that never made it into the ledger.
 *
 * Four loan numbers are missing from production — 238, 245, 311, 337 — all burned during
 * the 26 July import, seconds apart. `loan_number` is a Postgres sequence, and a failed
 * insert still consumes its value, so each gap is a row that was attempted and lost. The
 * loans themselves were real; only the records are missing.
 *
 * This writes one of them back, with its terms and payment history supplied by the owner.
 * Edit the block below and run; it refuses to touch a loan number that already exists.
 *
 * Two things here are deliberately not the defaults:
 *
 * The loan is short by ₹250. Fifteen thousand at the house rate of 25% repays ₹18,750, and
 * ₹18,500 came in across three payments. Rather than quietly reshaping the loan to match
 * what was collected, the terms stay standard and the last instalment is left partial — the
 * shortfall is recorded as a shortfall, and the loan is closed over it. Every other loan in
 * the book uses 25%; inventing a 23.33% loan to make the arithmetic land would hide it.
 *
 * The payments are spread the way the ledger spreads money everywhere else: earliest
 * instalment first, each taking the date of the receipt that cleared it. Three receipts
 * against five instalments means most instalments are settled by a payment that arrived
 * months after they were due, which is what actually happened.
 *
 * Dry run unless --write.
 */
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../src/server/db';
import { borrowers, capitalPoolLog, loans, payments, users } from '../src/server/db/schema';
import { calculateStartMonth, generatePaymentSchedule } from '../src/lib/calculations';
import { allocateReceipts } from '../src/lib/schedule';

// ── the loan being restored ──────────────────────────────────────────────────────────
const LOAN_NUMBER = 337;
const BORROWER_ID = 'edd0d684-af85-45db-a399-aa56275aa98e';
const DATE_GIVEN = '2026-03-05';
const PRINCIPAL = 60_000;

/** What actually came in, oldest first. Dated to the first of the month, as the ledger does. */
const RECEIPTS = [
  { amount: 10_000, date: '2026-04-01' },
  { amount: 10_000, date: '2026-05-01' },
  { amount: 10_000, date: '2026-06-01' },
  { amount: 12_500, date: '2026-07-01' },
  { amount: 12_500, date: '2026-08-01' },
  { amount: 15_000, date: '2026-09-01' },
];
// ─────────────────────────────────────────────────────────────────────────────────────

/**
 * Close the loan even though money is still owed.
 *
 * Off by default: status follows the money, as it does everywhere else in the ledger, so a
 * loan that is short stays active and keeps appearing in the collector's list. Turn it on
 * only when the owner has decided to let the remainder go — #238 was closed ₹250 short that
 * way, and the note on the loan says so.
 */
const CLOSE_SHORT = false;

// House terms. Every one of the 452 imported loans uses these, so they are constants
// rather than inputs — a loan that needed different ones would be worth noticing.
const SERVICE_CHARGE_PERCENT = 1;
const MARKUP_PERCENT = 25;
const INSTALMENTS = 5;

/**
 * Already done:
 *   #238  కోట మంగా దేవి         2025-09-12  ₹15,000  collected ₹18,500 of ₹18,750, closed short
 *   #311  నెకూరి పెద్ద అప్పారావు  2026-01-10  ₹20,000  repaid in full
 *
 * Still missing: 245.
 */

const WRITE = process.argv.includes('--write');
const money = (n: number) => `₹${n.toLocaleString('en-IN')}`;

async function main() {
  console.log('database:', new URL(process.env.DATABASE_URL!).host);
  console.log(WRITE ? 'MODE: WRITE\n' : 'MODE: dry run (pass --write to apply)\n');

  // Checked before the first query: an unset placeholder should say so, not come back as
  // a Postgres uuid syntax error with the whole select echoed.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(BORROWER_ID)) {
    throw new Error('Set BORROWER_ID to the borrower this loan belongs to');
  }

  const [borrower] = await db.select().from(borrowers).where(eq(borrowers.id, BORROWER_ID)).limit(1);
  if (!borrower) throw new Error('Borrower not found');
  if (borrower.deletedAt) throw new Error('Borrower is binned');

  const [clash] = await db.select({ id: loans.id }).from(loans)
    .where(eq(loans.loanNumber, LOAN_NUMBER)).limit(1);
  if (clash) throw new Error(`Loan #${LOAN_NUMBER} already exists — nothing to fill`);


  // Attributed to the same owner as the loans either side of it in the import.
  const [owner] = await db.select({ id: users.id, name: users.name })
    .from(users).where(eq(users.email, 'jagusaichandra@gmail.com')).limit(1);
  if (!owner) throw new Error('Owner account not found');

  const serviceCharge = PRINCIPAL * (SERVICE_CHARGE_PERCENT / 100);
  const handedOver = PRINCIPAL - serviceCharge;
  const repayable = PRINCIPAL * (1 + MARKUP_PERCENT / 100);
  const instalment = repayable / INSTALMENTS;

  const startMonth = calculateStartMonth(new Date(DATE_GIVEN));
  const schedule = generatePaymentSchedule(startMonth, repayable, INSTALMENTS, 'monthly');
  const allocated = allocateReceipts(
    schedule.map((s) => ({ installmentNumber: s.installmentNumber, amountDue: s.amountDue })),
    RECEIPTS,
  );

  const collected = allocated.reduce((sum, r) => sum + r.amountPaid, 0);
  const declared = RECEIPTS.reduce((sum, r) => sum + r.amount, 0);
  // The receipts are the fact being recorded; if the spread lost or invented a rupee the
  // whole exercise is wrong, so it is checked rather than assumed.
  if (Math.abs(collected - declared) > 0.01) {
    throw new Error(`Allocation changed the money: ${collected} vs ${declared}`);
  }

  console.log(`borrower   ${borrower.name}  ${borrower.mobile}`);
  console.log(`loan       #${LOAN_NUMBER}  given ${DATE_GIVEN}  start ${startMonth.toISOString().slice(0, 10)}`);
  console.log(`principal  ${money(PRINCIPAL)}   service charge ${money(serviceCharge)}   handed over ${money(handedOver)}`);
  console.log(`repayable  ${money(repayable)}   ${INSTALMENTS} × ${money(instalment)}`);
  const settled = collected >= repayable - 0.01;
  console.log(`collected  ${money(collected)}   short ${money(repayable - collected)}`);
  console.log(`status     ${settled || CLOSE_SHORT ? 'completed' : 'active'}${!settled && CLOSE_SHORT ? ' (closed short)' : ''}\n`);

  console.log('instalments:');
  for (let i = 0; i < allocated.length; i++) {
    const row = allocated[i];
    console.log(
      `  #${row.installmentNumber}  due ${schedule[i].dueDate.toISOString().slice(0, 10)}` +
      `  ${money(row.amountPaid)} / ${money(row.amountDue)}  ${row.status.padEnd(7)}` +
      `  paid ${row.paidDate ?? '—'}`,
    );
  }

  // Chained from the current last entry, the way createLoan does. The stored balance is
  // known to disagree with the sum of its own movements, so this keeps the delta correct
  // without pretending to repair a column this script has no business rewriting.
  const [lastEntry] = await db.select({ runningBalance: capitalPoolLog.runningBalance })
    .from(capitalPoolLog).orderBy(desc(capitalPoolLog.createdAt)).limit(1);
  let balance = lastEntry ? parseFloat(lastEntry.runningBalance) : 0;

  const loanId = crypto.randomUUID();

  /*
    event_date is a timestamp on this table, unlike the date columns on loans and payments,
    so it takes a Date rather than a string. Midnight UTC is what the existing rows hold —
    they render as 05:30 IST — so the same construction keeps this consistent with them.
  */
  const capitalRows: typeof capitalPoolLog.$inferInsert[] = [];
  balance -= PRINCIPAL;
  capitalRows.push({
    eventDate: new Date(DATE_GIVEN), eventType: 'disbursement', amount: PRINCIPAL.toFixed(2),
    runningBalance: balance.toFixed(2), referenceLoanId: loanId, recordedBy: owner.id,
    notes: `Loan #${LOAN_NUMBER} — restored from the 26 July import gap`,
  });
  for (const receipt of RECEIPTS) {
    balance += receipt.amount;
    capitalRows.push({
      eventDate: new Date(receipt.date), eventType: 'collection', amount: receipt.amount.toFixed(2),
      runningBalance: balance.toFixed(2), referenceLoanId: loanId, recordedBy: owner.id,
    });
  }

  console.log('\ncapital pool:');
  for (const row of capitalRows) {
    console.log(`  ${String(row.eventDate).slice(0, 15)}  ${String(row.eventType).padEnd(12)} ${money(Number(row.amount))}  → balance ${row.runningBalance}`);
  }

  if (!WRITE) { console.log('\ndry run — nothing written'); return; }

  /*
    One batch, which Neon runs as a single transaction. A loan without its schedule owes
    nothing and reads as settled; a schedule without its capital entries silently moves the
    pool. Neither half is meaningful alone.
  */
  const writes = [
    db.insert(loans).values({
      id: loanId,
      loanNumber: LOAN_NUMBER,
      borrowerId: BORROWER_ID,
      dateGiven: DATE_GIVEN,
      startMonth: startMonth.toISOString().slice(0, 10),
      primaryAmount: PRINCIPAL.toFixed(2),
      serviceChargePercent: SERVICE_CHARGE_PERCENT.toFixed(2),
      serviceChargeAmount: serviceCharge.toFixed(2),
      amountUserReceived: handedOver.toFixed(2),
      markupPercent: MARKUP_PERCENT.toFixed(2),
      totalRepayment: repayable.toFixed(2),
      tenureMonths: INSTALMENTS,
      paymentFrequency: 'monthly' as const,
      installmentAmount: instalment.toFixed(2),
      totalInstallments: INSTALMENTS,
      profitAmount: (repayable - PRINCIPAL).toFixed(2),
      // Follows the money unless the owner has chosen to close it short.
      status: (collected >= repayable - 0.01 || CLOSE_SHORT) ? ('completed' as const) : ('active' as const),
      notes: repayable - collected <= 0.01
        ? `Restored from the 26 July import gap. Repaid in full across ${RECEIPTS.length} payments.`
        : CLOSE_SHORT
          ? `Restored from the 26 July import gap. Collected ${money(collected)} of ${money(repayable)} across ${RECEIPTS.length} payments; ${money(repayable - collected)} uncollected and written off on closure.`
          : `Restored from the 26 July import gap. Collected ${money(collected)} of ${money(repayable)} across ${RECEIPTS.length} payments; ${money(repayable - collected)} still to collect.`,
      createdBy: owner.id,
    }),

    ...allocated.map((row, i) => db.insert(payments).values({
      loanId,
      installmentNumber: row.installmentNumber,
      dueDate: schedule[i].dueDate.toISOString().slice(0, 10),
      amountDue: row.amountDue.toFixed(2),
      amountPaid: row.amountPaid.toFixed(2),
      paidDate: row.paidDate,
      status: row.status as 'paid' | 'partial' | 'pending',
      paymentMethod: row.amountPaid > 0 ? ('cash' as const) : null,
      recordedBy: row.amountPaid > 0 ? owner.id : null,
    })),

    ...capitalRows.map((row) => db.insert(capitalPoolLog).values(row)),
  ] as const;

  await db.batch(writes as unknown as [typeof writes[number], ...typeof writes[number][]]);

  const [check] = await db.select().from(loans)
    .where(and(eq(loans.loanNumber, LOAN_NUMBER), eq(loans.borrowerId, BORROWER_ID))).limit(1);
  const written = await db.select().from(payments).where(eq(payments.loanId, loanId));
  const paid = written.reduce((sum, p) => sum + parseFloat(p.amountPaid), 0);
  const due = written.reduce((sum, p) => sum + parseFloat(p.amountDue), 0);

  console.log(`\n✓ loan #${check.loanNumber} created  (${check.status})`);
  console.log(`  instalments written: ${written.length}`);
  console.log(`  sum(amount_due)  ${money(due)}  ${Math.abs(due - repayable) < 0.01 ? 'matches repayable' : '*** MISMATCH ***'}`);
  console.log(`  sum(amount_paid) ${money(paid)}  ${Math.abs(paid - declared) < 0.01 ? 'matches the receipts' : '*** MISMATCH ***'}`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(String(e.message ?? e)); process.exit(1); });
