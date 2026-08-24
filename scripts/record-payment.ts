/**
 * Records a receipt that the ledger import never captured.
 *
 *   npx tsx --env-file=.env.prod scripts/record-payment.ts 348 10000 2026-08-01            (dry run)
 *   npx tsx --env-file=.env.prod scripts/record-payment.ts 348 10000 2026-08-01 --write
 *
 * The legacy sheet was a snapshot. Money collected after it was taken — or in a cell the
 * extraction missed — is simply absent from the app, which then reads a loan as still
 * owing when the borrower has paid.
 *
 * The money lands the way it lands everywhere else in this ledger: on the earliest
 * instalment still owing, with anything left over carried forward. That is the same rule
 * the payment screens and the collections day book follow, so a backfilled receipt is
 * indistinguishable from one recorded at the time.
 *
 * Prints what it would do and changes nothing without --write.
 */
import { asc, desc, eq } from 'drizzle-orm';
import { db } from '../src/server/db';
import { loans, payments, borrowers, capitalPoolLog, users } from '../src/server/db/schema';

const [, , rawLoan, rawAmount, rawDate] = process.argv;
const WRITE = process.argv.includes('--write');

const loanNumber = Number(rawLoan);
const amount = Number(rawAmount);

if (!Number.isInteger(loanNumber) || !Number.isFinite(amount) || amount <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(rawDate ?? '')) {
  console.error('usage: record-payment.ts <loanNumber> <amount> <YYYY-MM-DD> [--write]');
  process.exit(1);
}

const money = (n: number) => n.toFixed(2);
const rupees = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

async function main() {
  console.log(`database: ${new URL(process.env.DATABASE_URL!).host}\n`);

  const [loan] = await db
    .select({
      id: loans.id, n: loans.loanNumber, repay: loans.totalRepayment,
      status: loans.status, name: borrowers.name,
    })
    .from(loans)
    .innerJoin(borrowers, eq(loans.borrowerId, borrowers.id))
    .where(eq(loans.loanNumber, loanNumber))
    .limit(1);

  if (!loan) throw new Error(`no loan #${loanNumber}`);

  const rows = await db.select().from(payments)
    .where(eq(payments.loanId, loan.id)).orderBy(asc(payments.installmentNumber));

  const before = rows.reduce((s, p) => s + parseFloat(p.amountPaid), 0);
  console.log(`#${loan.n}  ${loan.name}`);
  console.log(`  repayable ${loan.repay}, collected ${rupees(before)}, recording ${rupees(amount)} on ${rawDate}\n`);

  // Earliest instalment still owing, then forward — the rule the whole ledger follows.
  let pool = amount;
  const touched: { id: string; n: number; due: number; was: number; now: number; status: string }[] = [];
  for (const p of rows) {
    if (pool <= 0.005) break;
    if (p.status === 'waived') continue;
    const due = parseFloat(p.amountDue);
    const already = parseFloat(p.amountPaid);
    const room = due - already;
    if (room <= 0.005) continue;
    const take = Math.min(pool, room);
    pool -= take;
    const now = already + take;
    touched.push({
      id: p.id, n: p.installmentNumber, due, was: already, now,
      status: now >= due - 0.01 ? 'paid' : 'partial',
    });
  }

  // Nothing left to fill: the surplus stays visible on the last row rather than vanishing.
  const last = rows[rows.length - 1];
  if (pool > 0.005 && last) {
    const existing = touched.find((t) => t.id === last.id);
    if (existing) existing.now += pool;
    else touched.push({
      id: last.id, n: last.installmentNumber, due: parseFloat(last.amountDue),
      was: parseFloat(last.amountPaid), now: parseFloat(last.amountPaid) + pool, status: 'paid',
    });
    console.log(`  note: ${rupees(pool)} more than this loan owes — held on the last instalment\n`);
  }

  for (const t of touched) {
    console.log(`    #${t.n}  ${money(t.due)}/${money(t.was)}  ->  ${money(t.due)}/${money(t.now)}  ${t.status}  ${rawDate}`);
  }

  const after = before + amount;
  const settled = after >= parseFloat(loan.repay) - 0.01;
  console.log(`\n  collected  ${rupees(before)}  ->  ${rupees(after)} of ${loan.repay}`);
  console.log(`  owing      ${rupees(Math.max(0, parseFloat(loan.repay) - before))}  ->  ${rupees(Math.max(0, parseFloat(loan.repay) - after))}`);
  console.log(`  status     ${loan.status}  ->  ${settled ? 'completed' : 'active'}`);
  console.log(`\n  capital pool: + a collection of ${money(amount)}`);

  if (!WRITE) { console.log('\ndry run — pass --write to apply'); return; }

  const [admin] = await db.select({ id: users.id }).from(users).where(eq(users.role, 'admin')).limit(1);

  for (const t of touched) {
    await db.update(payments).set({
      amountPaid: money(t.now),
      status: t.status as 'paid' | 'partial',
      paidDate: rawDate,
      paymentMethod: 'cash',
      recordedBy: admin?.id ?? null,
      updatedAt: new Date(),
    }).where(eq(payments.id, t.id));
  }

  // Follows the running balance the app itself keeps. That column is unreliable across the
  // seeded rows — a concurrent import raced it — so this only avoids making it worse.
  const [latest] = await db.select({ b: capitalPoolLog.runningBalance })
    .from(capitalPoolLog).orderBy(desc(capitalPoolLog.createdAt)).limit(1);
  const balance = latest ? parseFloat(latest.b) : 0;

  await db.insert(capitalPoolLog).values({
    eventType: 'collection',
    amount: money(amount),
    runningBalance: money(balance + amount),
    referenceLoanId: loan.id,
    recordedBy: admin!.id,
  });

  await db.update(loans)
    .set({ status: settled ? 'completed' : 'active', updatedAt: new Date() })
    .where(eq(loans.id, loan.id));

  console.log('\n✓ applied');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
