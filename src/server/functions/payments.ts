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

    const amountDue = parseFloat(payment.amountDue);
    const isFullPayment = data.amountPaid >= amountDue;
    let justCompleted = false;
    const newStatus = isFullPayment ? 'paid' : 'partial';

    // Update payment
    const [updated] = await db
      .update(payments)
      .set({
        amountPaid: data.amountPaid.toFixed(2),
        paidDate: data.paidDate,
        status: newStatus as 'paid' | 'partial',
        paymentMethod: data.paymentMethod,
        notes: data.notes || null,
        recordedBy: user.id,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, data.paymentId))
      .returning();

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

    // Check if all payments for this loan are paid → auto-complete loan
    if (isFullPayment) {
      const unpaid = await db
        .select({ id: payments.id })
        .from(payments)
        .where(
          and(
            eq(payments.loanId, payment.loanId),
            sql`${payments.status} NOT IN ('paid', 'waived')`,
          ),
        )
        .limit(1);

      if (unpaid.length === 0) {
        await db
          .update(loans)
          .set({ status: 'completed', updatedAt: new Date() })
          .where(eq(loans.id, payment.loanId));
        justCompleted = true;
      }
    }

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

    // Do not force 'partial'. An amount that covers the instalment must be recorded as
    // paid, or the row is stranded: the loan never auto-completes and the reminder cron
    // trips over an instalment it sees as open but cannot bill.
    const coversInstalment = data.amountPaid >= parseFloat(payment.amountDue);

    const [updated] = await db
      .update(payments)
      .set({
        amountPaid: data.amountPaid.toFixed(2),
        paidDate: data.paidDate,
        status: coversInstalment ? 'paid' : 'partial',
        paymentMethod: data.paymentMethod,
        notes: data.notes || null,
        recordedBy: user.id,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, data.paymentId))
      .returning();

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

    let justCompleted = false;
    if (coversInstalment) {
      const unpaid = await db
        .select({ id: payments.id })
        .from(payments)
        .where(and(
          eq(payments.loanId, payment.loanId),
          sql`${payments.status} NOT IN ('paid', 'waived')`,
        ))
        .limit(1);

      if (unpaid.length === 0) {
        await db
          .update(loans)
          .set({ status: 'completed', updatedAt: new Date() })
          .where(eq(loans.id, payment.loanId));
        justCompleted = true;
      }
    }

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

    // Check if all payments for this loan are paid/waived → auto-complete
    const unpaid = await db
      .select({ id: payments.id })
      .from(payments)
      .where(
        and(
          eq(payments.loanId, updated.loanId),
          sql`${payments.status} NOT IN ('paid', 'waived')`,
        ),
      )
      .limit(1);

    if (unpaid.length === 0) {
      await db
        .update(loans)
        .set({ status: 'completed', updatedAt: new Date() })
        .where(eq(loans.id, updated.loanId));
      // Waiving the last instalment closes the loan just as paying it would.
      await sendLoanClosed(updated.loanId);
    }

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

    // If the loan was completed, revert it back to active
    const [loan] = await db
      .select({ id: loans.id, status: loans.status })
      .from(loans)
      .where(eq(loans.id, payment.loanId))
      .limit(1);

    if (loan && loan.status === 'completed') {
      await db
        .update(loans)
        .set({ status: 'active', updatedAt: new Date() })
        .where(eq(loans.id, loan.id));
    }

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
