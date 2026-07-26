import { createServerFn } from '@tanstack/react-start';
import { eq, and, lte, or, desc, asc, gte, sql, count, type SQL } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';
import { db } from '../db';
import { payments, loans, borrowers, capitalPoolLog } from '../db/schema';
import { markPaymentSchema, markWaivedSchema } from '../validators/payment';
import { getAuthenticatedUser } from '../middleware/auth';
import { requireRole, requirePermission } from '../middleware/roleGuard';
import { sendPaymentReceipt, sendLoanClosed } from './whatsapp';
import { DEFAULTS } from '@/lib/constants';

export const listPaymentsByLoan = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => {
    const loanId = (data as { loanId: string }).loanId;
    if (!loanId) throw new Error('Loan ID is required');
    return { loanId };
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requireRole(user, ['admin', 'manager']);

    const result = await db
      .select()
      .from(payments)
      .where(eq(payments.loanId, data.loanId))
      .orderBy(payments.installmentNumber);

    return result;
  });

/**
 * Records money against a loan starting at one instalment and carrying any surplus
 * forward to the instalments after it.
 *
 * A borrower repays an amount, not a calendar. One month they hand over more, the next
 * less. Writing the whole amount onto the single instalment it was recorded against left
 * the surplus stranded there: someone who paid two months in one go still showed the
 * next month as owing, and the reminder cron would chase them for money already in hand.
 *
 * Whatever is left after the final instalment stays on that last row rather than being
 * dropped, so an overpayment is visible instead of lost.
 */
async function applyToSchedule(
  loanId: string,
  fromInstalment: number,
  amount: number,
  ctx: { paidDate: string; paymentMethod: string; notes?: string | null; userId: string },
) {
  const rows = await db
    .select()
    .from(payments)
    .where(eq(payments.loanId, loanId))
    .orderBy(asc(payments.installmentNumber));

  const targetIndex = rows.findIndex((r) => r.installmentNumber === fromInstalment);
  if (targetIndex < 0) throw new Error('Instalment not found on this loan');

  const target = rows[targetIndex];
  const targetDue = parseFloat(target.amountDue);
  const onTarget = Math.min(amount, targetDue);
  let surplus = amount - onTarget;

  const [updated] = await db
    .update(payments)
    .set({
      amountPaid: onTarget.toFixed(2),
      paidDate: ctx.paidDate,
      status: onTarget >= targetDue - 0.01 ? 'paid' : 'partial',
      paymentMethod: ctx.paymentMethod as 'cash' | 'upi' | 'bank_transfer' | 'other',
      notes: ctx.notes || null,
      recordedBy: ctx.userId,
      updatedAt: new Date(),
    })
    .where(eq(payments.id, target.id))
    .returning();

  // Roll what is left onto the following instalments, earliest first.
  for (let i = targetIndex + 1; i < rows.length && surplus > 0.005; i++) {
    const row = rows[i];
    if (row.status === 'waived') continue;

    const due = parseFloat(row.amountDue);
    const already = parseFloat(row.amountPaid);
    const capacity = due - already;
    if (capacity <= 0.005) continue;

    const take = Math.min(surplus, capacity);
    surplus -= take;
    const now = already + take;

    await db
      .update(payments)
      .set({
        amountPaid: now.toFixed(2),
        paidDate: row.paidDate ?? ctx.paidDate,
        status: now >= due - 0.01 ? 'paid' : 'partial',
        paymentMethod: (row.paymentMethod ?? ctx.paymentMethod) as 'cash' | 'upi' | 'bank_transfer' | 'other',
        recordedBy: row.recordedBy ?? ctx.userId,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, row.id));
  }

  if (surplus > 0.005 && rows.length) {
    const last = rows[rows.length - 1];
    const [current] = await db.select({ amountPaid: payments.amountPaid })
      .from(payments).where(eq(payments.id, last.id)).limit(1);
    await db
      .update(payments)
      .set({
        amountPaid: (parseFloat(current.amountPaid) + surplus).toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(payments.id, last.id));
  }

  return updated;
}

/**
 * Sets a loan's status from the money on it, and reports whether that just closed it.
 *
 * Completion is a question about an amount, not a period: the loan is over when the
 * borrower has handed over what they owe, however many instalments that took and however
 * uneven they were. A waived instalment counts as settled without money, since nothing
 * further is expected against it.
 *
 * Reversible in both directions, so reversing a payment reopens a loan the same way
 * recording one closes it. A defaulted loan is left alone — that status is a decision
 * someone made, not something arithmetic should overwrite.
 */
async function syncLoanStatus(loanId: string): Promise<boolean> {
  const [loan] = await db
    .select({ id: loans.id, status: loans.status, totalRepayment: loans.totalRepayment })
    .from(loans)
    .where(eq(loans.id, loanId))
    .limit(1);
  if (!loan || loan.status === 'defaulted') return false;

  const [{ settled }] = await db
    .select({
      settled: sql<string>`COALESCE(SUM(CASE WHEN ${payments.status} = 'waived'
        THEN ${payments.amountDue} ELSE ${payments.amountPaid} END), 0)`,
    })
    .from(payments)
    .where(eq(payments.loanId, loanId));

  const isRepaid = parseFloat(settled) >= parseFloat(loan.totalRepayment) - 0.01;
  const target = isRepaid ? 'completed' as const : 'active' as const;
  if (loan.status === target) return false;

  await db.update(loans)
    .set({ status: target, updatedAt: new Date() })
    .where(eq(loans.id, loanId));
  return isRepaid;
}

export const markPaymentPaid = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const { error, value } = markPaymentSchema.validate(data, { abortEarly: false });
    if (error) {
      throw new Error(error.details.map((d) => d.message).join(', '));
    }
    return value;
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requirePermission(user, 'payments.write');

    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, data.paymentId))
      .limit(1);

    if (!payment) throw new Error('Payment not found');

    // Anything beyond this instalment rolls onto the ones after it, so paying two
    // months in one go actually clears two months.
    const updated = await applyToSchedule(
      payment.loanId,
      payment.installmentNumber,
      data.amountPaid,
      { paidDate: data.paidDate, paymentMethod: data.paymentMethod, notes: data.notes, userId: user.id },
    );

    // Capital pool: collection entry
    const lastEntry = await db
      .select({ runningBalance: capitalPoolLog.runningBalance })
      .from(capitalPoolLog)
      .orderBy(desc(capitalPoolLog.createdAt))
      .limit(1);

    const currentBalance = lastEntry.length > 0
      ? parseFloat(lastEntry[0].runningBalance)
      : 0;

    await db.insert(capitalPoolLog).values({
      eventType: 'collection',
      amount: data.amountPaid.toFixed(2),
      runningBalance: (currentBalance + data.amountPaid).toFixed(2),
      referenceLoanId: payment.loanId,
      referencePaymentId: payment.id,
      recordedBy: user.id,
    });

    const justCompleted = await syncLoanStatus(payment.loanId);

    // Closure replaces the receipt rather than following it — two messages for the same
    // event would read as spam. Both are best-effort and swallow their own errors: a
    // WhatsApp outage must never make a recorded payment look like it failed. Awaited so
    // the send finishes before the serverless function freezes.
    if (justCompleted) await sendLoanClosed(payment.loanId);
    else await sendPaymentReceipt(payment.id);

    return updated;
  });

export const markPaymentPartial = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const { error, value } = markPaymentSchema.validate(data, { abortEarly: false });
    if (error) {
      throw new Error(error.details.map((d) => d.message).join(', '));
    }
    return value;
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requirePermission(user, 'payments.write');

    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, data.paymentId))
      .limit(1);

    if (!payment) throw new Error('Payment not found');

    // The same path as a full payment. An amount that covers the instalment is recorded
    // as paid rather than forced to 'partial', and anything over it rolls forward.
    const updated = await applyToSchedule(
      payment.loanId,
      payment.installmentNumber,
      data.amountPaid,
      { paidDate: data.paidDate, paymentMethod: data.paymentMethod, notes: data.notes, userId: user.id },
    );

    // Capital pool: collection entry
    const lastEntry = await db
      .select({ runningBalance: capitalPoolLog.runningBalance })
      .from(capitalPoolLog)
      .orderBy(desc(capitalPoolLog.createdAt))
      .limit(1);

    const currentBalance = lastEntry.length > 0
      ? parseFloat(lastEntry[0].runningBalance)
      : 0;

    await db.insert(capitalPoolLog).values({
      eventType: 'collection',
      amount: data.amountPaid.toFixed(2),
      runningBalance: (currentBalance + data.amountPaid).toFixed(2),
      referenceLoanId: payment.loanId,
      referencePaymentId: payment.id,
      recordedBy: user.id,
    });

    const justCompleted = await syncLoanStatus(payment.loanId);

    if (justCompleted) await sendLoanClosed(payment.loanId);
    else await sendPaymentReceipt(payment.id);

    return updated;
  });

export const markPaymentWaived = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const { error, value } = markWaivedSchema.validate(data, { abortEarly: false });
    if (error) {
      throw new Error(error.details.map((d) => d.message).join(', '));
    }
    return value;
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requirePermission(user, 'payments.write');

    const [updated] = await db
      .update(payments)
      .set({
        status: 'waived',
        notes: data.notes,
        recordedBy: user.id,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, data.paymentId))
      .returning();

    if (!updated) throw new Error('Payment not found');

    // Waiving the last of what is owed closes the loan just as paying it would.
    if (await syncLoanStatus(updated.loanId)) await sendLoanClosed(updated.loanId);

    return updated;
  });

/**
 * Shared page query for the three payment lists. They differ only in their filter and
 * sort column, so keeping one implementation avoids the count and the rows drifting apart.
 */
async function paginatedPayments(
  where: SQL | undefined,
  orderColumn: PgColumn,
  direction: 'asc' | 'desc',
  page: number,
  limit: number,
) {
  const offset = (page - 1) * limit;

  const [rows, totalResult] = await Promise.all([
    db
      .select({
        payment: payments,
        borrowerName: borrowers.name,
        borrowerNameTelugu: borrowers.nameTelugu,
        borrowerMobile: borrowers.mobile,
        loanPrimaryAmount: loans.primaryAmount,
      })
      .from(payments)
      .innerJoin(loans, eq(payments.loanId, loans.id))
      .innerJoin(borrowers, eq(loans.borrowerId, borrowers.id))
      .where(where)
      .orderBy(direction === 'desc' ? desc(orderColumn) : asc(orderColumn))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(payments)
      .innerJoin(loans, eq(payments.loanId, loans.id))
      .innerJoin(borrowers, eq(loans.borrowerId, borrowers.id))
      .where(where),
  ]);

  const total = totalResult[0].count;

  return {
    items: rows.map((r) => ({
      ...r.payment,
      borrowerName: r.borrowerName,
      borrowerNameTelugu: r.borrowerNameTelugu,
      borrowerMobile: r.borrowerMobile,
      loanPrimaryAmount: r.loanPrimaryAmount,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export const listUpcomingPayments = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => {
    const d = data as { days?: number; page?: number; limit?: number };
    return { days: d.days || 7, page: d.page || 1, limit: d.limit || DEFAULTS.ITEMS_PER_PAGE };
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requireRole(user, ['admin', 'manager']);

    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + data.days);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    const where = and(
      or(eq(payments.status, 'pending'), eq(payments.status, 'partial')),
      gte(payments.dueDate, today),
      lte(payments.dueDate, futureDateStr),
    );

    return paginatedPayments(where, payments.dueDate, 'asc', data.page, data.limit);
  });

export const listOverduePayments = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => {
    const d = (data ?? {}) as { page?: number; limit?: number };
    return { page: d.page || 1, limit: d.limit || DEFAULTS.ITEMS_PER_PAGE };
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requireRole(user, ['admin', 'manager']);

    const today = new Date().toISOString().split('T')[0];
    const where = and(
      or(
        eq(payments.status, 'pending'),
        eq(payments.status, 'partial'),
        eq(payments.status, 'overdue'),
      ),
      lte(payments.dueDate, today),
    );

    return paginatedPayments(where, payments.dueDate, 'asc', data.page, data.limit);
  });

export const listRecentPayments = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => {
    const d = (data ?? {}) as { page?: number; limit?: number };
    return { page: d.page || 1, limit: d.limit || DEFAULTS.ITEMS_PER_PAGE };
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requireRole(user, ['admin', 'manager']);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

    const where = and(
      or(eq(payments.status, 'paid'), eq(payments.status, 'waived')),
      gte(payments.paidDate, dateStr),
    );

    return paginatedPayments(where, payments.paidDate, 'desc', data.page, data.limit);
  });

export const revertPayment = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const d = data as { paymentId: string; reason?: string };
    if (!d.paymentId) throw new Error('Payment ID is required');
    return { paymentId: d.paymentId, reason: d.reason || '' };
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requirePermission(user, 'payments.write');

    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, data.paymentId))
      .limit(1);

    if (!payment) throw new Error('Payment not found');

    if (payment.status === 'pending' || payment.status === 'overdue') {
      throw new Error('PAYMENT_ALREADY_PENDING');
    }

    const previousAmountPaid = parseFloat(payment.amountPaid);

    // Determine reverted status based on due date
    const today = new Date().toISOString().split('T')[0];
    const revertedStatus = payment.dueDate <= today ? 'overdue' : 'pending';

    // Reset the payment
    const [updated] = await db
      .update(payments)
      .set({
        status: revertedStatus as 'pending' | 'overdue',
        amountPaid: '0.00',
        paidDate: null,
        paymentMethod: null,
        notes: data.reason ? `Reverted: ${data.reason}` : 'Reverted',
        recordedBy: user.id,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, data.paymentId))
      .returning();

    // Reverse the capital pool entry if there was money collected
    if (previousAmountPaid > 0) {
      const lastEntry = await db
        .select({ runningBalance: capitalPoolLog.runningBalance })
        .from(capitalPoolLog)
        .orderBy(desc(capitalPoolLog.createdAt))
        .limit(1);

      const currentBalance = lastEntry.length > 0
        ? parseFloat(lastEntry[0].runningBalance)
        : 0;

      await db.insert(capitalPoolLog).values({
        eventType: 'collection',
        amount: (-previousAmountPaid).toFixed(2),
        runningBalance: (currentBalance - previousAmountPaid).toFixed(2),
        referenceLoanId: payment.loanId,
        referencePaymentId: payment.id,
        notes: data.reason ? `Reversal: ${data.reason}` : 'Payment reversal',
        recordedBy: user.id,
      });
    }

    // Reopen only if the reversal actually leaves money owing. Reversing one instalment
    // on a loan the borrower had overpaid should not drag it back to active.
    await syncLoanStatus(payment.loanId);

    return updated;
  });

/**
 * Housekeeping, not a user action: flips instalments whose due date has passed to
 * overdue. The dashboard and the overdue tab call it on load, so it stays open to
 * both roles — it records no money and decides nothing a person chose.
 */
export const bulkUpdateOverdueStatus = createServerFn({ method: 'POST' }).handler(async () => {
  const user = await getAuthenticatedUser();
  requireRole(user, ['admin', 'manager']);

  const today = new Date().toISOString().split('T')[0];

  const result = await db
    .update(payments)
    .set({ status: 'overdue', updatedAt: new Date() })
    .where(
      and(
        eq(payments.status, 'pending'),
        lte(payments.dueDate, today),
      ),
    )
    .returning({ id: payments.id });

  return { updated: result.length };
});
