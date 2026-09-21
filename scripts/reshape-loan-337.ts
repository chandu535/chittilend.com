/**
 * Reshapes #337 so its instalments are the months that were actually paid.
 *
 * It was written as five even instalments of ₹15,000 and the six receipts spread across
 * them, which is how the ledger normally absorbs irregular payments — and it made the
 * screen read wrongly. Instalment #3 showed as "due 1 June, paid 1 August" when ₹10,000
 * was in fact handed over in June exactly as agreed. The spread was inventing lateness
 * that never happened.
 *
 * The arrangement was six declining monthly payments, so that is what the schedule
 * becomes: one instalment per month, each for the amount agreed that month, each settled
 * on its own date. A seventh carries the ₹5,000 still owed, which is the only part of this
 * loan that is genuinely outstanding.
 *
 * The one rule that cannot bend is that the instalments still sum to the ₹75,000 repayable.
 * Reshaping a schedule never changes the debt — that is what scripts/repair-phantom-
 * instalments.ts had to clean up the last time a row was added carrying its own amount.
 *
 * The capital pool is untouched: its six collections already match these receipts.
 *
 * Dry run unless --write.
 */
import { asc, eq } from 'drizzle-orm';
import { db } from '../src/server/db';
import { loans, payments } from '../src/server/db/schema';

const LOAN_NUMBER = 337;

/** The arrangement as it was actually made: month, amount agreed, and what came in. */
const SCHEDULE = [
  { dueDate: '2026-04-01', amountDue: 10_000, amountPaid: 10_000 },
  { dueDate: '2026-05-01', amountDue: 10_000, amountPaid: 10_000 },
  { dueDate: '2026-06-01', amountDue: 10_000, amountPaid: 10_000 },
  { dueDate: '2026-07-01', amountDue: 12_500, amountPaid: 12_500 },
  { dueDate: '2026-08-01', amountDue: 12_500, amountPaid: 12_500 },
  { dueDate: '2026-09-01', amountDue: 15_000, amountPaid: 15_000 },
  // The remainder. Nothing has been paid into it, and it is why the loan stays active.
  { dueDate: '2026-10-01', amountDue: 5_000, amountPaid: 0 },
];

const WRITE = process.argv.includes('--write');
const money = (n: number) => `₹${n.toLocaleString('en-IN')}`;

async function main() {
  console.log('database:', new URL(process.env.DATABASE_URL!).host);
  console.log(WRITE ? 'MODE: WRITE\n' : 'MODE: dry run (pass --write to apply)\n');

  const [loan] = await db.select().from(loans).where(eq(loans.loanNumber, LOAN_NUMBER)).limit(1);
  if (!loan) throw new Error(`Loan #${LOAN_NUMBER} not found`);

  const repayable = parseFloat(loan.totalRepayment);
  const totalDue = SCHEDULE.reduce((sum, r) => sum + r.amountDue, 0);
  const totalPaid = SCHEDULE.reduce((sum, r) => sum + r.amountPaid, 0);

  // The invariant. A schedule that does not sum to the repayable has either forgiven part
  // of the debt or invented some, and both are worse than leaving the loan as it was.
  if (Math.abs(totalDue - repayable) > 0.01) {
    throw new Error(`Schedule sums to ${totalDue}, but the loan repays ${repayable}`);
  }

  const existing = await db.select().from(payments)
    .where(eq(payments.loanId, loan.id)).orderBy(asc(payments.installmentNumber));
  const existingPaid = existing.reduce((sum, p) => sum + parseFloat(p.amountPaid), 0);

  // Money collected is a fact about the past; only the plan is being edited.
  if (Math.abs(existingPaid - totalPaid) > 0.01) {
    throw new Error(`This would change money collected: ${existingPaid} → ${totalPaid}`);
  }

  console.log(`#${LOAN_NUMBER}  ${loan.dateGiven}  ${money(parseFloat(loan.primaryAmount))} → ${money(repayable)}`);
  console.log(`\nbefore — ${existing.length} instalments:`);
  for (const p of existing) {
    console.log(`  #${p.installmentNumber}  due ${p.dueDate}  ${money(parseFloat(p.amountPaid))} / ${money(parseFloat(p.amountDue))}  ${p.status.padEnd(7)}  paid ${p.paidDate ?? '—'}`);
  }

  console.log(`\nafter — ${SCHEDULE.length} instalments:`);
  const rows = SCHEDULE.map((row, i) => {
    const settled = row.amountPaid >= row.amountDue - 0.01;
    return {
      installmentNumber: i + 1,
      dueDate: row.dueDate,
      amountDue: row.amountDue.toFixed(2),
      amountPaid: row.amountPaid.toFixed(2),
      // Each instalment was settled in its own month, which is what actually happened.
      paidDate: row.amountPaid > 0 ? row.dueDate : null,
      status: (settled ? 'paid' : row.amountPaid > 0 ? 'partial' : 'pending') as 'paid' | 'partial' | 'pending',
      paymentMethod: row.amountPaid > 0 ? ('cash' as const) : null,
      recordedBy: row.amountPaid > 0 ? loan.createdBy : null,
    };
  });
  for (const r of rows) {
    console.log(`  #${r.installmentNumber}  due ${r.dueDate}  ${money(Number(r.amountPaid))} / ${money(Number(r.amountDue))}  ${r.status.padEnd(7)}  paid ${r.paidDate ?? '—'}`);
  }

  console.log(`\nsum(amount_due)   ${money(totalDue)}  matches repayable`);
  console.log(`sum(amount_paid)  ${money(totalPaid)}  unchanged`);
  console.log(`still owing       ${money(repayable - totalPaid)}`);

  if (!WRITE) { console.log('\ndry run — nothing written'); return; }

  const writes = [
    db.delete(payments).where(eq(payments.loanId, loan.id)),
    ...rows.map((r) => db.insert(payments).values({ loanId: loan.id, ...r })),
    db.update(loans).set({
      totalInstallments: SCHEDULE.length,
      tenureMonths: SCHEDULE.length,
      // Instalments vary here, so this is the average rather than the figure on any one
      // row. Nothing computes from it — the rows carry the real amounts.
      installmentAmount: (repayable / SCHEDULE.length).toFixed(2),
      notes: `Restored from the 26 July import gap. Six declining monthly payments as agreed (${SCHEDULE.slice(0, 6).map((r) => money(r.amountDue)).join(', ')}); ${money(repayable - totalPaid)} still to collect.`,
      updatedAt: new Date(),
    }).where(eq(loans.id, loan.id)),
  ] as const;

  await db.batch(writes as unknown as [typeof writes[number], ...typeof writes[number][]]);

  const after = await db.select().from(payments)
    .where(eq(payments.loanId, loan.id)).orderBy(asc(payments.installmentNumber));
  const due = after.reduce((s, p) => s + parseFloat(p.amountDue), 0);
  const paid = after.reduce((s, p) => s + parseFloat(p.amountPaid), 0);

  console.log(`\n✓ reshaped to ${after.length} instalments`);
  console.log(`  sum(amount_due)  ${money(due)}  ${Math.abs(due - repayable) < 0.01 ? 'holds' : '*** BROKEN ***'}`);
  console.log(`  sum(amount_paid) ${money(paid)}  ${Math.abs(paid - existingPaid) < 0.01 ? 'unchanged' : '*** MONEY MOVED ***'}`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(String(e.message ?? e)); process.exit(1); });
