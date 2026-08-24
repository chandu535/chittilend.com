/**
 * Corrects a loan whose principal was imported wrong, and everything that follows from it.
 *
 *   npx tsx --env-file=.env.prod scripts/repair-loan-principal.ts 348 20000            (dry run)
 *   npx tsx --env-file=.env.prod scripts/repair-loan-principal.ts 348 20000 --write
 *
 * The legacy sheet's Amount(IN) column is the repayable, and the import derived the
 * principal from it. Where that cell was wrong the whole loan is wrong in step: the
 * repayable, the instalment, the schedule, the status, and the disbursement the capital
 * pool recorded. Fixing the principal alone would leave a loan that disagrees with itself.
 *
 * Money already collected is never touched. It is re-allocated across the corrected
 * schedule by the same rule the rest of the app follows — earliest instalment first,
 * surplus carried forward — and each instalment keeps the date of the receipt that cleared
 * it, so monthly cash flow and the capital ledger built from it stay intact.
 *
 * Prints what it would do and changes nothing without --write.
 */
import { and, asc, eq } from 'drizzle-orm';
import { db } from '../src/server/db';
import { loans, payments, borrowers, capitalPoolLog } from '../src/server/db/schema';

const [, , rawLoan, rawPrincipal] = process.argv;
const WRITE = process.argv.includes('--write');

const loanNumber = Number(rawLoan);
const principal = Number(rawPrincipal);

if (!Number.isInteger(loanNumber) || !Number.isFinite(principal) || principal <= 0) {
  console.error('usage: repair-loan-principal.ts <loanNumber> <correctPrincipal> [--write]');
  process.exit(1);
}

const money = (n: number) => n.toFixed(2);
const rupees = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

async function main() {
  console.log(`database: ${new URL(process.env.DATABASE_URL!).host}\n`);

  const [row] = await db
    .select({
      id: loans.id, n: loans.loanNumber, status: loans.status,
      primary: loans.primaryAmount, out: loans.amountUserReceived, repay: loans.totalRepayment,
      inst: loans.installmentAmount, count: loans.totalInstallments,
      svc: loans.serviceChargePercent, markup: loans.markupPercent,
      profit: loans.profitAmount, name: borrowers.name, mobile: borrowers.mobile,
    })
    .from(loans)
    .innerJoin(borrowers, eq(loans.borrowerId, borrowers.id))
    .where(eq(loans.loanNumber, loanNumber))
    .limit(1);

  if (!row) throw new Error(`no loan #${loanNumber}`);

  // Recomputed the way the app computes a new loan, so a repaired loan is indistinguishable
  // from one entered correctly in the first place.
  const svc = parseFloat(row.svc);
  const markup = parseFloat(row.markup);
  const handedOver = principal * (1 - svc / 100);
  const repayable = principal * (1 + markup / 100);
  const instalment = repayable / row.count;

  console.log(`#${row.n}  ${row.name}  ${row.mobile}\n`);
  console.log(`                    now            ->  corrected`);
  console.log(`  principal      ${String(row.primary).padStart(10)}  ->  ${money(principal).padStart(10)}`);
  console.log(`  handed over    ${String(row.out).padStart(10)}  ->  ${money(handedOver).padStart(10)}`);
  console.log(`  repayable      ${String(row.repay).padStart(10)}  ->  ${money(repayable).padStart(10)}`);
  console.log(`  instalment     ${String(row.inst).padStart(10)}  ->  ${money(instalment).padStart(10)}   (x${row.count})`);

  const ps = await db.select().from(payments)
    .where(eq(payments.loanId, row.id)).orderBy(asc(payments.installmentNumber));

  // Every receipt that actually arrived, oldest first, with the date it arrived on.
  const receipts = ps
    .filter((p) => parseFloat(p.amountPaid) > 0)
    .map((p) => ({ amount: parseFloat(p.amountPaid), date: p.paidDate }))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

  const collected = receipts.reduce((s, r) => s + r.amount, 0);
  console.log(`\n  collected ${rupees(collected)} across ${receipts.length} receipt(s), untouched by this repair`);

  // Earliest instalment first, surplus carried forward — the rule the whole ledger follows.
  let pool = collected;
  const plan = ps.map((p) => {
    const due = instalment;
    const take = Math.min(pool, due);
    pool -= take;
    const status = take >= due - 0.01 ? 'paid' : take > 0 ? 'partial' : 'pending';
    return { row: p, due, paid: take, status: status as 'paid' | 'partial' | 'pending' };
  });
  if (pool > 0.01 && plan.length) {
    // An overpayment stays visible on the last row rather than being dropped.
    plan[plan.length - 1].paid += pool;
    pool = 0;
  }

  // Each instalment takes the date of the receipt that cleared it.
  let cursor = 0; let used = 0;
  for (const step of plan) {
    if (step.paid <= 0.005) { step.row.paidDate = null; continue; }
    let need = step.paid;
    let date = receipts[Math.min(cursor, receipts.length - 1)]?.date ?? null;
    while (need > 0.005 && cursor < receipts.length) {
      const left = receipts[cursor].amount - used;
      const take = Math.min(need, left);
      need -= take; used += take;
      date = receipts[cursor].date;
      if (used >= receipts[cursor].amount - 0.005) { cursor++; used = 0; }
    }
    step.row.paidDate = date;
  }

  console.log(`\n  schedule:`);
  for (const s of plan) {
    const before = `${s.row.amountDue}/${s.row.amountPaid} ${s.row.status}`;
    console.log(`    #${s.row.installmentNumber}  ${before.padEnd(28)} ->  ${money(s.due)}/${money(s.paid)} ${s.status}  ${s.row.paidDate ?? '-'}`);
  }

  const settled = plan.reduce((sum, s) => sum + (s.row.status === 'waived' ? s.due : s.paid), 0);
  const nowStatus = settled >= repayable - 0.01 ? 'completed' : 'active';
  const owing = Math.max(0, repayable - settled);
  console.log(`\n  status         ${row.status.padStart(10)}  ->  ${nowStatus.padStart(10)}`);
  console.log(`  still owing    ${rupees(0).padStart(10)}  ->  ${rupees(owing).padStart(10)}`);

  // The pool handed over the real principal, not the imported one.
  const [disb] = await db.select().from(capitalPoolLog)
    .where(and(eq(capitalPoolLog.referenceLoanId, row.id), eq(capitalPoolLog.eventType, 'disbursement')))
    .limit(1);
  if (disb) {
    console.log(`\n  capital disbursement  ${String(disb.amount).padStart(10)}  ->  ${money(principal).padStart(10)}`);
  } else {
    console.log(`\n  no capital disbursement recorded for this loan — leaving the ledger alone`);
  }

  const invariant = plan.reduce((s, p) => s + p.due, 0);
  console.log(`\n  sum(amountDue) = ${money(invariant)} vs repayable ${money(repayable)} ${Math.abs(invariant - repayable) < 0.01 ? 'OK' : '*** MISMATCH ***'}`);

  if (!WRITE) { console.log('\ndry run — pass --write to apply'); return; }

  for (const s of plan) {
    await db.update(payments).set({
      amountDue: money(s.due),
      amountPaid: money(s.paid),
      status: s.status,
      paidDate: s.row.paidDate,
      updatedAt: new Date(),
    }).where(eq(payments.id, s.row.id));
  }

  await db.update(loans).set({
    primaryAmount: money(principal),
    amountUserReceived: money(handedOver),
    serviceChargeAmount: money(principal * (svc / 100)),
    totalRepayment: money(repayable),
    installmentAmount: money(instalment),
    profitAmount: money(repayable - principal),
    status: nowStatus,
    updatedAt: new Date(),
  }).where(eq(loans.id, row.id));

  if (disb) {
    await db.update(capitalPoolLog).set({ amount: money(principal) }).where(eq(capitalPoolLog.id, disb.id));
  }

  console.log('\n✓ applied');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
