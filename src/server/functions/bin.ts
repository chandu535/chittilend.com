import { createServerFn } from '@tanstack/react-start';
import { and, count, desc, eq, inArray, isNotNull, notInArray, sql } from 'drizzle-orm';
import { db } from '../db';
import { borrowers, capitalPoolLog, loans, payments, users } from '../db/schema';
import {
  borrowerLive,
  liveLoanCountSql,
  loanLive,
  mobileFree,
  mobileHolderSql,
  totalLoanCountSql,
} from '../db/softDelete';
import { getAuthenticatedUser } from '../middleware/auth';
import { requirePermission } from '../middleware/roleGuard';
import { deleteBorrowerObjects } from '@/lib/r2';
import { DEFAULTS } from '@/lib/constants';
import {
  BIN_REASONS,
  canBinBorrower,
  canBinLoan,
  canPurgeBorrower,
  canPurgeLoan,
  canRestoreBorrower,
  canRestoreLoan,
  encodeRefusal,
  type BorrowerFacts,
  type Decision,
  type LoanFacts,
} from '@/lib/binRules';

/**
 * Moving things to the Bin, bringing them back, and destroying them.
 *
 * Two things shape every function here.
 *
 * **The rule lives in the WHERE clause.** Each operation is a single guarded statement
 * whose conditions are the rule itself, so the check and the write happen at the same
 * instant and there is no window in between for the world to change. A statement that
 * matches nothing has been refused; only then is the row re-read, to work out which
 * refusal to report. Being a moment stale at that point is harmless — the answer is a
 * sentence, not a decision.
 *
 * **The capital pool is never touched.** `capital_pool_log` records cash that genuinely
 * moved and its running balance is a stored cumulative figure that cannot be recomputed
 * from the rows. Binning a loan takes it off the books and leaves every rupee of history
 * where it is, so the two will legitimately disagree afterwards. Purging goes as far as
 * detaching the pointers — and writes what the loan was into the entry's notes first, so
 * the money never becomes an unexplainable amount with nothing attached to it.
 */

/**
 * Today in IST. Inlined rather than imported from notifications.ts, which would drag the
 * whole messaging module into this one for a date string.
 */
function istToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

// ---------------------------------------------------------------------------
// Reading the facts a refusal is explained from
// ---------------------------------------------------------------------------

async function loanFacts(id: string): Promise<LoanFacts | null> {
  const [row] = await db
    .select({ status: loans.status, deletedAt: loans.deletedAt })
    .from(loans)
    .where(eq(loans.id, id))
    .limit(1);
  return row ? { status: row.status, deleted: row.deletedAt !== null } : null;
}

async function borrowerFacts(id: string): Promise<BorrowerFacts | null> {
  const [row] = await db
    .select({
      deletedAt: borrowers.deletedAt,
      liveLoanCount: liveLoanCountSql,
      totalLoanCount: totalLoanCountSql,
      mobileHolder: mobileHolderSql,
    })
    .from(borrowers)
    .where(eq(borrowers.id, id))
    .limit(1);

  if (!row) return null;
  return {
    deleted: row.deletedAt !== null,
    liveLoanCount: Number(row.liveLoanCount),
    totalLoanCount: Number(row.totalLoanCount),
    mobileHolder: row.mobileHolder ?? null,
  };
}

/** The borrower behind a loan, for the cascade rules. */
async function borrowerFactsForLoan(loanId: string): Promise<BorrowerFacts | null> {
  const [row] = await db
    .select({ borrowerId: loans.borrowerId })
    .from(loans)
    .where(eq(loans.id, loanId))
    .limit(1);
  return row ? borrowerFacts(row.borrowerId) : null;
}

/**
 * Turns a decision into the error a refused call throws. Reached only when a statement
 * matched nothing, so a decision that says "allowed" means the row moved underneath us —
 * reported as a plain conflict rather than pretending to know more.
 */
function refuse(decision: Decision, fallback: string): never {
  if (decision.allowed) throw new Error(fallback);
  throw new Error(encodeRefusal(decision.reason, decision.detail));
}

// ---------------------------------------------------------------------------
// Moving to the Bin
// ---------------------------------------------------------------------------

const loanId = (data: unknown) => {
  const id = (data as { id?: string }).id;
  if (!id) throw new Error('Loan ID is required');
  return { id };
};

const borrowerId = (data: unknown) => {
  const id = (data as { id?: string }).id;
  if (!id) throw new Error('Borrower ID is required');
  return { id };
};

export const binLoan = createServerFn({ method: 'POST' })
  .inputValidator(loanId)
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requirePermission(user, 'bin.write');

    // The rule, as the statement: not already binned, and not still owing.
    const [binned] = await db
      .update(loans)
      .set({ deletedAt: new Date(), deletedBy: user.id, updatedAt: new Date() })
      .where(and(
        eq(loans.id, data.id),
        loanLive,
        notInArray(loans.status, ['active', 'extended']),
      ))
      .returning({ id: loans.id });

    if (binned) return { success: true };

    const facts = await loanFacts(data.id);
    if (!facts) throw new Error(BIN_REASONS.LOAN_NOT_FOUND);
    refuse(canBinLoan(facts), BIN_REASONS.LOAN_NOT_FOUND);
  });

export const binBorrower = createServerFn({ method: 'POST' })
  .inputValidator(borrowerId)
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requirePermission(user, 'bin.write');

    // NOT EXISTS rather than a counted pre-check: a loan created a millisecond ago is
    // still caught, and no loan can be orphaned by losing that race.
    const [binned] = await db
      .update(borrowers)
      .set({ deletedAt: new Date(), deletedBy: user.id, updatedAt: new Date() })
      .where(and(
        eq(borrowers.id, data.id),
        borrowerLive,
        sql`NOT EXISTS (
          SELECT 1 FROM loans l WHERE l.borrower_id = ${borrowers.id} AND l.deleted_at IS NULL
        )`,
      ))
      .returning({ id: borrowers.id });

    if (binned) return { success: true };

    const facts = await borrowerFacts(data.id);
    if (!facts) throw new Error(BIN_REASONS.BORROWER_NOT_FOUND);
    refuse(canBinBorrower(facts), BIN_REASONS.BORROWER_NOT_FOUND);
  });

// ---------------------------------------------------------------------------
// Bringing things back
// ---------------------------------------------------------------------------

export const restoreBorrower = createServerFn({ method: 'POST' })
  .inputValidator(borrowerId)
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requirePermission(user, 'bin.write');

    // `mobileFree` is the same predicate as the partial unique index, so this either
    // succeeds or reports a conflict — it never reaches the index and fails there with a
    // constraint message nobody can read.
    const [restored] = await db
      .update(borrowers)
      .set({ deletedAt: null, deletedBy: null, updatedAt: new Date() })
      .where(and(eq(borrowers.id, data.id), isNotNull(borrowers.deletedAt), mobileFree))
      .returning({ id: borrowers.id });

    if (restored) return { success: true };

    const facts = await borrowerFacts(data.id);
    if (!facts) throw new Error(BIN_REASONS.BORROWER_NOT_FOUND);
    refuse(canRestoreBorrower(facts), BIN_REASONS.BORROWER_NOT_FOUND);
  });

export const restoreLoan = createServerFn({ method: 'POST' })
  .inputValidator(loanId)
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requirePermission(user, 'bin.write');

    // Two statements in one transaction, arranged so neither can happen without the other.
    //
    // The first brings the borrower back, but only if their number is still free — and
    // does nothing at all when they were never binned. The second brings the loan back,
    // but only if a live borrower exists once the first has run. So if the borrower could
    // not be restored, the loan is not restored either, and the transaction leaves both
    // exactly as they were. No branching, which a batch could not express anyway.
    const results = await db.batch([
      db
        .update(borrowers)
        .set({ deletedAt: null, deletedBy: null, updatedAt: new Date() })
        .where(and(
          isNotNull(borrowers.deletedAt),
          mobileFree,
          sql`${borrowers.id} = (SELECT l.borrower_id FROM loans l WHERE l.id = ${data.id})`,
        ))
        .returning({ id: borrowers.id }),
      db
        .update(loans)
        .set({ deletedAt: null, deletedBy: null, updatedAt: new Date() })
        .where(and(
          eq(loans.id, data.id),
          isNotNull(loans.deletedAt),
          sql`EXISTS (
            SELECT 1 FROM borrowers b WHERE b.id = ${loans.borrowerId} AND b.deleted_at IS NULL
          )`,
        ))
        .returning({ id: loans.id }),
    ]);

    const [restoredBorrower, restoredLoan] = results;
    if (restoredLoan.length > 0) {
      return { success: true, alsoRestoredBorrower: restoredBorrower.length > 0 };
    }

    const loan = await loanFacts(data.id);
    if (!loan) throw new Error(BIN_REASONS.LOAN_NOT_FOUND);
    const borrower = await borrowerFactsForLoan(data.id);
    if (!borrower) throw new Error(BIN_REASONS.BORROWER_NOT_FOUND);
    refuse(canRestoreLoan(loan, borrower), BIN_REASONS.LOAN_NOT_FOUND);
  });

// ---------------------------------------------------------------------------
// Destroying for good
// ---------------------------------------------------------------------------

export const purgeLoan = createServerFn({ method: 'POST' })
  .inputValidator(loanId)
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requirePermission(user, 'bin.purge');

    const [target] = await db
      .select({
        loanNumber: loans.loanNumber,
        borrowerName: borrowers.name,
        deletedAt: loans.deletedAt,
      })
      .from(loans)
      .innerJoin(borrowers, eq(loans.borrowerId, borrowers.id))
      .where(and(eq(loans.id, data.id), isNotNull(loans.deletedAt)))
      .limit(1);

    if (!target) {
      const facts = await loanFacts(data.id);
      if (!facts) throw new Error(BIN_REASONS.LOAN_NOT_FOUND);
      refuse(canPurgeLoan(facts), BIN_REASONS.LOAN_NOT_FOUND);
    }

    // What the money was for, written into the ledger entry before the pointer goes.
    // Without it the Capital page would show a disbursement of some amount with no loan
    // and no name attached — permanently unexplainable, which is worse than the phantom
    // instalments this codebase already had to repair once.
    const stamp = `[loan #${target.loanNumber} ${target.borrowerName} purged ${istToday()}]`;
    const appendNote = sql`COALESCE(${capitalPoolLog.notes} || ' ', '') || ${stamp}`;

    // Guard repeated on every statement so the batch is all-or-nothing in effect: if the
    // loan stopped being binned between the read and here, none of them match.
    const stillBinned = sql`EXISTS (
      SELECT 1 FROM loans WHERE id = ${data.id} AND deleted_at IS NOT NULL
    )`;

    const results = await db.batch([
      // Collections against this loan's instalments. The cash stays in the pool; only the
      // link to a row that is about to disappear is cut.
      db
        .update(capitalPoolLog)
        .set({ referencePaymentId: null, notes: appendNote })
        .where(and(
          inArray(
            capitalPoolLog.referencePaymentId,
            db.select({ id: payments.id }).from(payments).where(eq(payments.loanId, data.id)),
          ),
          stillBinned,
        )),
      // The disbursement, and anything else naming the loan directly.
      db
        .update(capitalPoolLog)
        .set({ referenceLoanId: null, notes: appendNote })
        .where(and(eq(capitalPoolLog.referenceLoanId, data.id), stillBinned)),
      // payments and notification_log cascade from loans, so this is the whole delete —
      // but it must come last, because the payment pointers above are read from the rows
      // that cascade away here.
      db
        .delete(loans)
        .where(and(eq(loans.id, data.id), isNotNull(loans.deletedAt)))
        .returning({ id: loans.id }),
    ]);

    if (results[2].length === 0) throw new Error(BIN_REASONS.LOAN_NOT_BINNED);
    return { success: true };
  });

export const purgeBorrower = createServerFn({ method: 'POST' })
  .inputValidator(borrowerId)
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requirePermission(user, 'bin.purge');

    // Stricter than binning: even a binned loan holds a borrower in place, because
    // destroying them would leave that loan pointing at nothing and there is no undo.
    const noLoansAtAll = sql`NOT EXISTS (
      SELECT 1 FROM loans l WHERE l.borrower_id = ${data.id}
    )`;

    const results = await db.batch([
      // surety_reference_id is a self-pointer with no foreign key behind it, so nothing at
      // the database level would stop it dangling. Whoever named this borrower as their
      // surety loses the reference rather than keeping a broken one.
      db
        .update(borrowers)
        .set({ suretyReferenceId: null, updatedAt: new Date() })
        .where(and(
          eq(borrowers.suretyReferenceId, data.id),
          sql`EXISTS (SELECT 1 FROM borrowers WHERE id = ${data.id} AND deleted_at IS NOT NULL)`,
          noLoansAtAll,
        )),
      // notification_log cascades from borrowers.
      db
        .delete(borrowers)
        .where(and(eq(borrowers.id, data.id), isNotNull(borrowers.deletedAt), noLoansAtAll))
        .returning({ id: borrowers.id }),
    ]);

    if (results[1].length === 0) {
      const facts = await borrowerFacts(data.id);
      if (!facts) throw new Error(BIN_REASONS.BORROWER_NOT_FOUND);
      refuse(canPurgeBorrower(facts), BIN_REASONS.BORROWER_NOT_FOUND);
    }

    // After the commit, and best-effort. An orphaned object is clutter; a live row
    // pointing at an image that is already gone is a broken page, so the order is not
    // negotiable. The photos include Aadhaar scans, which is why this happens at all.
    let photosDeleted = 0;
    try {
      photosDeleted = await deleteBorrowerObjects(data.id);
    } catch (error) {
      console.warn('[bin] R2 cleanup failed for', data.id, error instanceof Error ? error.message : error);
    }

    return { success: true, photosDeleted };
  });

// ---------------------------------------------------------------------------
// What is in the Bin
// ---------------------------------------------------------------------------

const pageInput = (data: unknown) => {
  const d = data as { page?: number; limit?: number };
  return { page: d.page || 1, limit: d.limit || DEFAULTS.ITEMS_PER_PAGE };
};

/**
 * Every row carries the facts the rules need — the borrower's state and any mobile
 * conflict included — so the page can disable the right button and name the conflict
 * without a second round trip, and so client and server judge the same inputs.
 */
export const listBinnedLoans = createServerFn({ method: 'GET' })
  .inputValidator(pageInput)
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requirePermission(user, 'bin.view');

    const offset = (data.page - 1) * data.limit;
    const where = isNotNull(loans.deletedAt);

    const [items, totalResult] = await Promise.all([
      db
        .select({
          id: loans.id,
          loanNumber: loans.loanNumber,
          status: loans.status,
          primaryAmount: loans.primaryAmount,
          totalRepayment: loans.totalRepayment,
          dateGiven: loans.dateGiven,
          deletedAt: loans.deletedAt,
          deletedByName: users.name,
          borrowerId: borrowers.id,
          borrowerName: borrowers.name,
          borrowerNameTelugu: borrowers.nameTelugu,
          borrowerMobile: borrowers.mobile,
          borrowerPhotoUrl: borrowers.profilePhotoUrl,
          borrowerDeletedAt: borrowers.deletedAt,
          // The conflict that would block restoring this loan's borrower alongside it.
          borrowerMobileHolder: mobileHolderSql,
        })
        .from(loans)
        .innerJoin(borrowers, eq(loans.borrowerId, borrowers.id))
        .leftJoin(users, eq(loans.deletedBy, users.id))
        .where(where)
        .orderBy(desc(loans.deletedAt))
        .limit(data.limit)
        .offset(offset),
      db.select({ count: count() }).from(loans).where(where),
    ]);

    const total = totalResult[0].count;
    return {
      items: items.map((row) => ({
        ...row,
        borrowerDeleted: row.borrowerDeletedAt !== null,
        borrowerMobileHolder: row.borrowerMobileHolder ?? null,
      })),
      total,
      page: data.page,
      limit: data.limit,
      totalPages: Math.ceil(total / data.limit),
    };
  });

export const listBinnedBorrowers = createServerFn({ method: 'GET' })
  .inputValidator(pageInput)
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requirePermission(user, 'bin.view');

    const offset = (data.page - 1) * data.limit;
    const where = isNotNull(borrowers.deletedAt);

    const [items, totalResult] = await Promise.all([
      db
        .select({
          id: borrowers.id,
          name: borrowers.name,
          nameTelugu: borrowers.nameTelugu,
          mobile: borrowers.mobile,
          area: borrowers.area,
          profilePhotoUrl: borrowers.profilePhotoUrl,
          deletedAt: borrowers.deletedAt,
          deletedByName: users.name,
          // Both counts: one decides whether they can come back, the other whether they
          // can be destroyed. A binned borrower has no live loans by construction, but
          // reading it rather than assuming keeps the rule's inputs honest.
          liveLoanCount: liveLoanCountSql,
          totalLoanCount: totalLoanCountSql,
          mobileHolder: mobileHolderSql,
        })
        .from(borrowers)
        .leftJoin(users, eq(borrowers.deletedBy, users.id))
        .where(where)
        .orderBy(desc(borrowers.deletedAt))
        .limit(data.limit)
        .offset(offset),
      db.select({ count: count() }).from(borrowers).where(where),
    ]);

    const total = totalResult[0].count;
    return {
      items: items.map((row) => ({
        ...row,
        liveLoanCount: Number(row.liveLoanCount),
        totalLoanCount: Number(row.totalLoanCount),
        mobileHolder: row.mobileHolder ?? null,
      })),
      total,
      page: data.page,
      limit: data.limit,
      totalPages: Math.ceil(total / data.limit),
    };
  });
