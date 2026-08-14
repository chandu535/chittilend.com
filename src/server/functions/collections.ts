import { createServerFn } from '@tanstack/react-start';
import { and, asc, desc, eq, ne, sql } from 'drizzle-orm';
import { db } from '../db';
import { borrowers, capitalPoolLog, collectionEntries, loans, payments } from '../db/schema';
import { getAuthenticatedUser } from '../middleware/auth';
import { requirePermission } from '../middleware/roleGuard';
import { borrowerLive, loanLive } from '../db/softDelete';
import { applyToSchedule, syncLoanStatus } from './payments';
import { issueLoan } from './loans';
import { requestSheetSync } from '../sheets/sync';
import { DEFAULTS, LIMITS } from '@/lib/constants';

/**
 * The day book: what a collector wrote down, and what an admin does with it.
 *
 * The screen this serves is worked by someone who cannot read the rest of the app. Every
 * decision here follows from that. Recording is deliberately weak — it writes a claim and
 * moves nothing — and applying is deliberately strong, because that is where a mistyped
 * amount would become a settled instalment or a real loan.
 *
 * The two are separate permissions rather than one, so the collector can work all day
 * without ever being able to spend anything.
 */

/**
 * Today in IST. Inlined rather than imported, the same way bin.ts does it — pulling in
 * another module for a date string costs more than the four lines.
 */
function istToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

/**
 * Adds one line to the capital ledger, carrying its running balance forward.
 *
 * Reads only capital_pool_log, so no live predicate applies: the ledger records cash that
 * genuinely moved and its running balance cannot be recomputed, which is why binning a loan
 * deliberately leaves it alone — see the note in softDelete.ts.
 */
async function recordCapital(
  eventType: 'collection' | 'disbursement',
  amount: number,
  loanId: string,
  userId: string,
) {
  const [last] = await db
    .select({ runningBalance: capitalPoolLog.runningBalance })
    .from(capitalPoolLog)
    .orderBy(desc(capitalPoolLog.createdAt))
    .limit(1);

  const balance = last ? parseFloat(last.runningBalance) : 0;
  const delta = eventType === 'collection' ? amount : -amount;

  await db.insert(capitalPoolLog).values({
    eventType,
    amount: amount.toFixed(2),
    runningBalance: (balance + delta).toFixed(2),
    referenceLoanId: loanId,
    recordedBy: userId,
  });
}

/**
 * The day book itself.
 *
 * Pending first and newest at the top, because the screen is read from the top by someone
 * checking what they have just written. Applied rows follow, so the day's work stays
 * visible as a statement rather than vanishing the moment it is approved.
 */
export const listCollectionEntries = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => {
    const d = (data ?? {}) as { limit?: number };
    return { limit: Math.min(d.limit ?? 60, 200) };
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requirePermission(user, 'collections.record');

    const rows = await db
      .select({
        id: collectionEntries.id,
        kind: collectionEntries.kind,
        amount: collectionEntries.amount,
        status: collectionEntries.status,
        note: collectionEntries.note,
        recordedAt: collectionEntries.recordedAt,
        appliedAt: collectionEntries.appliedAt,
        lastError: collectionEntries.lastError,
        borrowerId: collectionEntries.borrowerId,
        borrowerName: borrowers.name,
        borrowerNameTelugu: borrowers.nameTelugu,
        borrowerMobile: borrowers.mobile,
        borrowerPhotoUrl: borrowers.profilePhotoUrl,
        loanId: collectionEntries.loanId,
        loanNumber: loans.loanNumber,
      })
      .from(collectionEntries)
      .innerJoin(borrowers, eq(collectionEntries.borrowerId, borrowers.id))
      // Left, not inner: a `given` entry has no loan until it is applied, and an inner
      // join would hide exactly the rows waiting to be approved.
      .leftJoin(loans, eq(collectionEntries.loanId, loans.id))
      .where(and(borrowerLive, ne(collectionEntries.status, 'discarded')))
      .orderBy(
        // Pending above applied, whatever the clock says.
        sql`CASE WHEN ${collectionEntries.status} = 'pending' THEN 0 ELSE 1 END`,
        desc(collectionEntries.recordedAt),
      )
      .limit(data.limit);

    const pending = rows.filter((r) => r.status === 'pending');

    return {
      rows,
      pendingCount: pending.length,
      // Shown on the apply bar so an admin knows what they are about to commit without
      // adding it up themselves.
      pendingTaken: pending
        .filter((r) => r.kind === 'taken')
        .reduce((sum, r) => sum + parseFloat(r.amount), 0),
      pendingGiven: pending
        .filter((r) => r.kind === 'given')
        .reduce((sum, r) => sum + parseFloat(r.amount), 0),
      canApply: user.role === 'admin',
    };
  });

/**
 * Writes a line. Moves nothing.
 *
 * Money taken names a loan, because that is what the collector picked. Money given names
 * only a borrower — it becomes a loan when an admin approves it, and inventing the loan
 * here would be exactly the thing this separation exists to prevent.
 */
export const addCollectionEntry = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const d = data as { kind?: string; borrowerId?: string; loanId?: string; amount?: number; note?: string };

    // Captured rather than read off `d` again below: narrowing on a property of a mutable
    // object does not survive, and the insert needs the literal type.
    const kind = d.kind;
    if (kind !== 'taken' && kind !== 'given') throw new Error('Entry must be taken or given');
    if (!d.borrowerId) throw new Error('Borrower is required');

    const amount = Number(d.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('Enter an amount');
    // Two decimal places, since this is money and the column carries no more.
    if (Math.round(amount * 100) !== amount * 100) throw new Error('Amount can have at most two decimals');

    if (kind === 'taken' && !d.loanId) throw new Error('Choose which loan this is for');
    // A `given` entry becomes a real loan on apply, so it has to clear the same floor the
    // loan form enforces. Refusing here rather than at apply keeps the bad news with the
    // person who typed it, instead of surfacing on someone else's screen hours later.
    if (kind === 'given' && amount < LIMITS.MIN_LOAN_AMOUNT) {
      throw new Error(`Minimum loan amount is ₹${LIMITS.MIN_LOAN_AMOUNT.toLocaleString('en-IN')}`);
    }
    if (amount > LIMITS.MAX_LOAN_AMOUNT) throw new Error('That amount is too large');

    return {
      kind,
      borrowerId: d.borrowerId,
      loanId: kind === 'taken' ? d.loanId! : null,
      amount,
      note: (d.note ?? '').trim().slice(0, LIMITS.MAX_NOTE_LENGTH) || null,
    };
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requirePermission(user, 'collections.record');

    const [borrower] = await db
      .select({ id: borrowers.id })
      .from(borrowers)
      .where(and(eq(borrowers.id, data.borrowerId), borrowerLive))
      .limit(1);
    if (!borrower) throw new Error('Borrower not found');

    if (data.loanId) {
      // Checked here as well as at apply. A loan binned between the two is caught later;
      // one that was already binned should never have been offered in the first place.
      const [loan] = await db
        .select({ id: loans.id })
        .from(loans)
        .where(and(eq(loans.id, data.loanId), eq(loans.borrowerId, data.borrowerId), loanLive))
        .limit(1);
      if (!loan) throw new Error('That loan is not available');
    }

    const [entry] = await db
      .insert(collectionEntries)
      .values({
        // Re-narrowed: the validator proves this is one of the two, but the literal type
        // does not survive the server-function boundary, which serialises its input.
        kind: data.kind as 'taken' | 'given',
        borrowerId: data.borrowerId,
        loanId: data.loanId,
        amount: data.amount.toFixed(2),
        note: data.note,
        recordedBy: user.id,
      })
      .returning();

    return entry;
  });

/** What applying one entry did, or why it could not. */
type ApplyOutcome = { id: string; ok: true } | { id: string; ok: false; error: string };

/**
 * Turns one claim into ledger movement.
 *
 * The row is claimed before any money moves — a conditional update that only succeeds from
 * `pending` — so two admins tapping Apply at the same moment cannot both get through and
 * charge a borrower twice. If the work then fails, the claim is released with the reason
 * attached, which is the same lease shape sheets/sync.ts uses for the same reason.
 */
async function applyOne(entryId: string, userId: string): Promise<ApplyOutcome> {
  const [claimed] = await db
    .update(collectionEntries)
    .set({ status: 'applied', appliedBy: userId, appliedAt: new Date(), lastError: null, updatedAt: new Date() })
    .where(and(eq(collectionEntries.id, entryId), eq(collectionEntries.status, 'pending')))
    .returning();

  if (!claimed) return { id: entryId, ok: false, error: 'Already applied or discarded' };

  const release = async (error: string): Promise<ApplyOutcome> => {
    await db
      .update(collectionEntries)
      .set({ status: 'pending', appliedBy: null, appliedAt: null, lastError: error, updatedAt: new Date() })
      .where(eq(collectionEntries.id, entryId));
    return { id: entryId, ok: false, error };
  };

  try {
    const amount = parseFloat(claimed.amount);

    if (claimed.kind === 'given') {
      // Becomes a loan on the house's standard terms. The collector types one number at a
      // doorstep; every other term is a policy decision they are not being asked to make,
      // and the admin approving it can edit the loan afterwards like any other.
      const loan = await issueLoan({
        borrowerId: claimed.borrowerId,
        dateGiven: istToday(),
        primaryAmount: amount,
        tenureMonths: DEFAULTS.TENURE_MONTHS,
        paymentFrequency: DEFAULTS.PAYMENT_FREQUENCY,
        serviceChargePercent: DEFAULTS.SERVICE_CHARGE_PERCENT,
        markupPercent: DEFAULTS.MARKUP_PERCENT,
        notes: claimed.note,
      }, userId);

      await db
        .update(collectionEntries)
        .set({ loanId: loan.id, updatedAt: new Date() })
        .where(eq(collectionEntries.id, entryId));

      return { id: entryId, ok: true };
    }

    // ----- taken -----
    if (!claimed.loanId) return release('This entry has no loan');

    const [loan] = await db
      .select({ id: loans.id })
      .from(loans)
      .innerJoin(borrowers, eq(loans.borrowerId, borrowers.id))
      .where(and(eq(loans.id, claimed.loanId), loanLive, borrowerLive))
      .limit(1);
    if (!loan) return release('That loan is no longer available');

    // The earliest instalment still owing. Money repays the oldest debt first, which is
    // the rule the whole ledger follows — applyToSchedule then carries any surplus
    // forward, so paying three months in one go actually clears three months.
    const [target] = await db
      .select({ installmentNumber: payments.installmentNumber })
      .from(payments)
      .where(and(
        eq(payments.loanId, claimed.loanId),
        sql`${payments.status} NOT IN ('paid', 'waived')`,
      ))
      .orderBy(asc(payments.installmentNumber))
      .limit(1);

    if (!target) return release('This loan is already settled');

    await applyToSchedule(claimed.loanId, target.installmentNumber, amount, {
      paidDate: istToday(),
      paymentMethod: 'cash',
      notes: claimed.note,
      userId,
    });

    await recordCapital('collection', amount, claimed.loanId, userId);
    await syncLoanStatus(claimed.loanId);

    return { id: entryId, ok: true };
  } catch (error) {
    return release(error instanceof Error ? error.message : 'Could not apply this entry');
  }
}

export const applyCollectionEntry = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const id = (data as { id?: string }).id;
    if (!id) throw new Error('Entry is required');
    return { id };
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requirePermission(user, 'collections.apply');

    const outcome = await applyOne(data.id, user.id);
    if (outcome.ok) await requestSheetSync();
    return outcome;
  });

/**
 * Applies everything still waiting, one at a time.
 *
 * Sequential on purpose. Each entry moves the capital pool's running balance, which is
 * read-then-written, so running them together would let two entries read the same balance
 * and one of them would write the other's out of the ledger.
 *
 * A failure stops nothing. One borrower's loan being binned mid-round should not hold up
 * the rest of the day's collection, so the bad row keeps its reason and the others land.
 */
export const applyAllCollectionEntries = createServerFn({ method: 'POST' })
  .handler(async () => {
    const user = await getAuthenticatedUser();
    requirePermission(user, 'collections.apply');

    const waiting = await db
      .select({ id: collectionEntries.id })
      .from(collectionEntries)
      .where(eq(collectionEntries.status, 'pending'))
      .orderBy(asc(collectionEntries.recordedAt));

    const outcomes: ApplyOutcome[] = [];
    for (const row of waiting) outcomes.push(await applyOne(row.id, user.id));

    const applied = outcomes.filter((o) => o.ok).length;
    if (applied > 0) await requestSheetSync();

    return { applied, failed: outcomes.length - applied, outcomes };
  });

/**
 * Takes a line out of the book without applying it.
 *
 * Collectors mistype. Without this a wrong entry sits at the top of the screen for ever,
 * and the only ways out would be applying money that never moved or editing the database
 * by hand. Discarded rows are kept, not deleted — someone wrote them down, and that is
 * worth being able to look at.
 */
export const discardCollectionEntry = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const id = (data as { id?: string }).id;
    if (!id) throw new Error('Entry is required');
    return { id };
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requirePermission(user, 'collections.apply');

    const [discarded] = await db
      .update(collectionEntries)
      .set({ status: 'discarded', updatedAt: new Date() })
      .where(and(eq(collectionEntries.id, data.id), eq(collectionEntries.status, 'pending')))
      .returning();

    if (!discarded) throw new Error('That entry has already been applied');
    return { success: true };
  });
