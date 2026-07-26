/**
 * Seeds the extracted legacy ledger into a database.
 *
 *   npm run seed:prod            dry run — reports what it would write, writes nothing
 *   npm run seed:prod -- --write actually insert
 *   npm run seed:prod -- --write --photos   also upload photos to R2
 *
 * Reads .extract/ledger.json, produced by scripts/extract-ledger.py.
 *
 * Order matters: users -> borrowers -> loans -> payments -> capital pool. Every step is
 * idempotent on a natural key, so a partial run can be re-run without duplicating.
 */
import { readFileSync, existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { hash } from 'bcryptjs';
import { eq, sql as raw } from 'drizzle-orm';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { db } from '../src/server/db';
import { users, borrowers, loans, payments, capitalPoolLog } from '../src/server/db/schema';
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from '../src/lib/r2';

const WRITE = process.argv.includes('--write');
const WITH_PHOTOS = process.argv.includes('--photos');
const EXTRACT_DIR = '.extract';

const SEED_USERS = [
  { name: 'Jagu Sai Chandra', email: 'jagusaichandra@gmail.com', role: 'admin' as const, password: '12345678' },
  { name: 'Sai Teja', email: 'saiteja2121@gmail.com', role: 'admin' as const, password: '12345678' },
  { name: 'Jagu Srinivas', email: 'jagusrinivas789@gmail.com', role: 'manager' as const, password: '12345678' },
];

interface Ledger {
  borrowers: Array<{
    key: string; name: string; mobile: string | null; mobileMissing: boolean;
    area: string | null; locationUrl: string | null; photo: string | null; aadhaar: string | null;
    loanCount: number;
  }>;
  loans: Array<{
    sheetRow: number; serial: number | string; displaySerial: string; borrowerKey: string;
    dateGiven: string | null; primaryAmount: number | null; amountUserReceived: number | null;
    totalRepayment: number | null; serviceChargePercent: number; markupPercent: number;
    payments: Array<{ month: string; amount: number }>;
    totalPaid: number; outstanding: number;
  }>;
  warnings: Array<Record<string, unknown>>;
}

const money = (n: number) => n.toFixed(2);
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Repayment starts the 1st of the month after disbursement, as calculateLoan does. */
function startMonth(dateGiven: string): Date {
  const [y, m] = dateGiven.split('-').map(Number);
  return new Date(y, m, 1);
}

/**
 * A phone-less borrower still needs a unique mobile, because the column is NOT NULL with
 * a unique index. A deterministic placeholder keeps the row importable and obviously
 * flags it for a human to complete — it can never collide with a real Indian mobile
 * because it starts with 0.
 */
function placeholderMobile(index: number): string {
  return `0000${String(index).padStart(6, '0')}`;
}

async function main() {
  const ledgerPath = path.join(EXTRACT_DIR, 'ledger.json');
  if (!existsSync(ledgerPath)) {
    throw new Error(`${ledgerPath} not found — run scripts/extract-ledger.py first`);
  }
  const ledger: Ledger = JSON.parse(readFileSync(ledgerPath, 'utf8'));

  console.log(WRITE ? '=== WRITING to the database ===' : '=== DRY RUN — nothing will be written ===');
  console.log(`source: ${ledgerPath}\n`);

  // ---------------------------------------------------------------- users
  let userId: string | null = null;
  const userReport: string[] = [];
  for (const u of SEED_USERS) {
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, u.email)).limit(1);
    if (existing) {
      userReport.push(`exists  ${u.email} (${u.role})`);
      userId ??= existing.id;
      continue;
    }
    if (!WRITE) { userReport.push(`create  ${u.email} (${u.role})`); continue; }
    const [created] = await db.insert(users).values({
      name: u.name, email: u.email, role: u.role,
      passwordHash: await hash(u.password, 10), isActive: true,
    }).returning({ id: users.id });
    userReport.push(`created ${u.email} (${u.role})`);
    userId ??= created.id;
  }
  console.log('users:');
  userReport.forEach((l) => console.log('  ' + l));

  if (!userId) {
    if (WRITE) throw new Error('no user available to own the imported records');
    userId = '00000000-0000-0000-0000-000000000000';
    console.log('  (dry run: using a placeholder owner id)');
  }

  // ------------------------------------------------------------ borrowers
  const borrowerIdByKey = new Map<string, string>();
  let bCreated = 0, bExisting = 0, placeholders = 0;

  for (const [i, b] of ledger.borrowers.entries()) {
    const mobile = b.mobile ?? placeholderMobile(i + 1);
    if (!b.mobile) placeholders++;

    const [existing] = await db.select({ id: borrowers.id }).from(borrowers)
      .where(eq(borrowers.mobile, mobile)).limit(1);
    if (existing) {
      borrowerIdByKey.set(b.key, existing.id);
      bExisting++;
      continue;
    }
    if (!WRITE) { bCreated++; continue; }

    const [created] = await db.insert(borrowers).values({
      name: b.name,
      mobile,
      area: b.area,
      locationLat: null,
      locationLng: null,
      address: b.locationUrl,          // the sheet only had a maps link, no street address
      suretyType: 'owner',
      portalToken: crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, ''),
      createdBy: userId,
    }).returning({ id: borrowers.id });
    borrowerIdByKey.set(b.key, created.id);
    bCreated++;
  }
  console.log(`\nborrowers: ${bCreated} to create, ${bExisting} already present`);
  console.log(`  placeholder mobiles (no phone in the sheet): ${placeholders}`);

  // The sequence must clear the highest imported serial *before* any insert. Loans whose
  // serial is not numeric (e.g. "396/1") fall back to nextval, and with the sequence still
  // at 1 that collides with the loan already numbered 1.
  const maxSerial = Math.max(
    0,
    ...ledger.loans.map((l) => (typeof l.serial === 'number' ? l.serial : 0)),
  );
  if (WRITE) {
    await db.execute(raw`SELECT setval('loans_loan_number_seq', GREATEST(
      ${maxSerial}, (SELECT COALESCE(MAX(loan_number), 0) FROM loans)))`);
    console.log(`\nloan_number sequence advanced past ${maxSerial}`);
  }

  // ---------------------------------------------------------------- loans
  let lCreated = 0, lSkipped = 0, pCreated = 0;
  const capitalEvents: Array<{ at: Date; type: 'disbursement' | 'collection'; amount: number; loanId: string; paymentId?: string }> = [];

  for (const l of ledger.loans) {
    const borrowerId = borrowerIdByKey.get(l.borrowerKey);
    if (!borrowerId && WRITE) { lSkipped++; continue; }
    if (!l.dateGiven || !l.totalRepayment || !l.primaryAmount) { lSkipped++; continue; }

    // A duplicated serial keeps its numeric value but gains a suffix in displaySerial
    // (e.g. 357 -> "357-a"). Only the first occurrence may claim the number; the second
    // must take a fresh one from the sequence, or the loanNumber clash check below
    // silently drops it as "already imported".
    const isSuffixed = String(l.serial) !== l.displaySerial;
    const loanNumber = typeof l.serial === 'number' && !isSuffixed ? l.serial : null;
    if (loanNumber !== null) {
      const [clash] = await db.select({ id: loans.id }).from(loans)
        .where(eq(loans.loanNumber, loanNumber)).limit(1);
      if (clash) { lSkipped++; continue; }        // already imported
    } else {
      // No numeric serial to key on, so fall back to the marker written into notes.
      // Without this a re-run would duplicate these loans.
      const marker = `S No ${l.displaySerial}, sheet row ${l.sheetRow}`;
      const [clash] = await db.select({ id: loans.id }).from(loans)
        .where(raw`${loans.notes} LIKE ${'%' + marker + '%'}`).limit(1);
      if (clash) { lSkipped++; continue; }
    }

    // Planned tenure: the app's 5-month default, widened when the sheet shows more
    // instalments were actually taken.
    const totalInstallments = Math.max(5, l.payments.length);
    // The last instalment absorbs the rounding, exactly as generatePaymentSchedule does,
    // so the schedule sums to the amount repayable to the paisa. Splitting evenly left
    // Rs 25,000 over six months as 6 x 4166.67 = 25,000.02, and the final instalment then
    // read "partial" two paise short on a loan that was fully repaid.
    const repayable = l.totalRepayment;
    const installmentAmount = repayable / totalInstallments;
    const evenShare = Math.round(installmentAmount * 100) / 100;
    const dueFor = (n: number) => n === totalInstallments - 1
      ? repayable - evenShare * (totalInstallments - 1)
      : evenShare;
    const serviceCharge = l.primaryAmount * (l.serviceChargePercent / 100);
    const start = startMonth(l.dateGiven);
    // Completion is decided by the instalments, not by the money total. Deciding it on
    // money produced 171 loans marked completed while an instalment was still unpaid,
    // because the sheet records fewer, larger payments than the even split. The
    // allocation below fills instalments in order, so the two now agree.

    const notes = [
      `Imported from ledger (S No ${l.displaySerial}, sheet row ${l.sheetRow}).`,
      l.outstanding < -1 ? `OVERPAID by ${money(Math.abs(l.outstanding))} — review.` : null,
    ].filter(Boolean).join(' ');

    // Allocate receipts across the schedule in order, the way a repayment actually
    // applies: to the earliest outstanding instalment. Each instalment takes the date of
    // the receipt that cleared it, so monthly cash flow is preserved.
    const receipts = [...l.payments].sort((a, b) => (a.month < b.month ? -1 : 1));
    let cursor = 0;
    let pool = receipts.reduce((sum, r) => sum + r.amount, 0);
    const todayStr = iso(new Date());

    const rows: Array<Omit<typeof payments.$inferInsert, 'loanId'>> = [];
    for (let n = 0; n < totalInstallments; n++) {
      const due = new Date(start.getFullYear(), start.getMonth() + n, 1);
      const rowDue = dueFor(n);
      const take = Math.min(pool, rowDue);
      pool -= take;

      let paidDate: string | null = null;
      if (take > 0) {
        let remaining = take;
        while (remaining > 0.005 && cursor < receipts.length) {
          paidDate = receipts[cursor].month;
          if (receipts[cursor].amount > remaining) {
            receipts[cursor].amount -= remaining;
            remaining = 0;
          } else {
            remaining -= receipts[cursor].amount;
            cursor++;
          }
        }
      }
      const dueStr = iso(due);
      rows.push({
        installmentNumber: n + 1,
        dueDate: dueStr,
        amountDue: money(rowDue),
        amountPaid: money(take),
        paidDate,
        status: take >= rowDue - 0.01 ? 'paid'
          : take > 0 ? 'partial'
          : dueStr <= todayStr ? 'overdue' : 'pending',
        paymentMethod: take > 0 ? 'cash' : null,
        recordedBy: take > 0 ? userId : null,
      });
    }
    if (pool > 0.01) {
      // Money beyond the amount repayable is real money the borrower handed over, so it
      // stays on the final instalment rather than being discarded.
      const last = rows[rows.length - 1];
      last.amountPaid = money(parseFloat(String(last.amountPaid)) + pool);
      last.paidDate ??= receipts[receipts.length - 1]?.month ?? last.dueDate;
      last.status = 'paid';
      last.paymentMethod ??= 'cash';
      last.recordedBy ??= userId;
      last.notes = `Received ${money(pool)} beyond the amount repayable — review.`;
    }
    const fullyPaid = rows.every((r) => r.status === 'paid');


    if (!WRITE) {
      lCreated++;
      pCreated += totalInstallments;
      continue;
    }

    const [loan] = await db.insert(loans).values({
      loanNumber: loanNumber ?? undefined,
      borrowerId: borrowerId!,
      dateGiven: l.dateGiven,
      startMonth: iso(start),
      primaryAmount: money(l.primaryAmount),
      serviceChargePercent: money(l.serviceChargePercent),
      serviceChargeAmount: money(serviceCharge),
      amountUserReceived: money(l.amountUserReceived ?? l.primaryAmount - serviceCharge),
      markupPercent: money(l.markupPercent),
      totalRepayment: money(l.totalRepayment),
      tenureMonths: totalInstallments,
      paymentFrequency: 'monthly',
      installmentAmount: money(installmentAmount),
      totalInstallments,
      profitAmount: money(l.totalRepayment - l.primaryAmount),
      status: fullyPaid ? 'completed' : 'active',
      notes,
      createdBy: userId,
    }).returning({ id: loans.id });

    capitalEvents.push({ at: new Date(l.dateGiven), type: 'disbursement', amount: l.primaryAmount, loanId: loan.id });

    const inserted = await db.insert(payments).values(rows.map((r) => ({ ...r, loanId: loan.id }))).returning({ id: payments.id, amountPaid: payments.amountPaid, dueDate: payments.dueDate });
    pCreated += inserted.length;
    for (const p of inserted) {
      const amt = parseFloat(p.amountPaid);
      if (amt > 0) capitalEvents.push({ at: new Date(p.dueDate), type: 'collection', amount: amt, loanId: loan.id, paymentId: p.id });
    }
    lCreated++;
  }

  console.log(`\nloans:    ${lCreated} to create, ${lSkipped} skipped`);
  console.log(`payments: ${pCreated} rows`);

  // -------------------------------------------------------- capital pool
  // Derived from the database rather than from this run's inserts: a resumed run would
  // otherwise log capital only for the loans it happened to add, leaving the ledger
  // permanently incomplete. Rebuilt wholesale so the running balance is always coherent.
  if (WRITE) {
    await db.delete(capitalPoolLog);
    const dbLoans = await db.select({ id: loans.id, dateGiven: loans.dateGiven, primaryAmount: loans.primaryAmount }).from(loans);
    const dbPays = await db.select({ id: payments.id, loanId: payments.loanId, paidDate: payments.paidDate, amountPaid: payments.amountPaid }).from(payments);
    capitalEvents.length = 0;
    for (const l of dbLoans) {
      capitalEvents.push({ at: new Date(l.dateGiven), type: 'disbursement', amount: parseFloat(l.primaryAmount), loanId: l.id });
    }
    for (const p of dbPays) {
      const amt = parseFloat(p.amountPaid);
      if (amt > 0 && p.paidDate) {
        capitalEvents.push({ at: new Date(p.paidDate), type: 'collection', amount: amt, loanId: p.loanId, paymentId: p.id });
      }
    }
  }

  if (WRITE && capitalEvents.length) {
    capitalEvents.sort((a, b) => a.at.getTime() - b.at.getTime());
    let balance = 0;
    const rows = capitalEvents.map((e) => {
      balance += e.type === 'collection' ? e.amount : -e.amount;
      return {
        eventDate: e.at,
        eventType: e.type,
        amount: money(e.amount),
        runningBalance: money(balance),
        referenceLoanId: e.loanId,
        referencePaymentId: e.paymentId ?? null,
        notes: 'Imported from legacy ledger',
        recordedBy: userId,
      };
    });
    for (let i = 0; i < rows.length; i += 500) {
      await db.insert(capitalPoolLog).values(rows.slice(i, i + 500));
    }
    console.log(`capital:  ${rows.length} events, closing balance ${money(balance)}`);
    console.log('  (negative until an opening investment is recorded — expected)');
  } else {
    console.log(`capital:  ${capitalEvents.length || '~1987'} events would be written`);
  }

  // --------------------------------------------------------------- photos
  if (WITH_PHOTOS && WRITE) {
    let up = 0, failed = 0;
    for (const b of ledger.borrowers) {
      const id = borrowerIdByKey.get(b.key);
      if (!id) continue;
      for (const [kind, file] of [['profile', b.photo], ['aadhaar', b.aadhaar]] as const) {
        if (!file) continue;
        try {
          const body = await readFile(path.join(EXTRACT_DIR, 'photos', file));
          const key = `borrowers/${id}/${kind}${path.extname(file)}`;
          await r2Client.send(new PutObjectCommand({
            Bucket: R2_BUCKET, Key: key, Body: body, ContentType: 'image/jpeg',
            CacheControl: 'public, max-age=31536000',
          }));
          const url = `${R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
          await db.update(borrowers)
            .set(kind === 'profile' ? { profilePhotoUrl: url } : { aadhaarPhotoUrl: url })
            .where(eq(borrowers.id, id));
          up++;
        } catch (e) {
          failed++;
          console.warn(`  photo failed for ${b.key} (${kind}):`, e instanceof Error ? e.message : e);
        }
      }
    }
    console.log(`\nphotos:   ${up} uploaded, ${failed} failed`);
  } else {
    const n = ledger.borrowers.filter((b) => b.photo).length + ledger.borrowers.filter((b) => b.aadhaar).length;
    console.log(`\nphotos:   ${n} would upload (pass --photos)`);
  }

  console.log(WRITE ? '\nDone.' : '\nDry run complete. Re-run with --write to apply.');
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
