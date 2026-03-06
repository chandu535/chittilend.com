import { createServerFn } from '@tanstack/react-start';
import { eq, and, lte, or, desc, gte, sql } from 'drizzle-orm';
import { db } from '../db';
import { payments, loans, borrowers, capitalPoolLog } from '../db/schema';
import { markPaymentSchema, markWaivedSchema } from '../validators/payment';
import { getAuthenticatedUser } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';

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
    requireRole(user, ['admin', 'manager']);

    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, data.paymentId))
      .limit(1);

    if (!payment) throw new Error('Payment not found');

    const amountDue = parseFloat(payment.amountDue);
    const isFullPayment = data.amountPaid >= amountDue;
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
      }
    }

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
    requireRole(user, ['admin', 'manager']);

    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, data.paymentId))
      .limit(1);

    if (!payment) throw new Error('Payment not found');

    const [updated] = await db
      .update(payments)
      .set({
        amountPaid: data.amountPaid.toFixed(2),
        paidDate: data.paidDate,
        status: 'partial',
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
    requireRole(user, ['admin', 'manager']);

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
    }

    return updated;
  });

export const listUpcomingPayments = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => {
    const days = (data as { days?: number }).days || 7;
    return { days };
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requireRole(user, ['admin', 'manager']);

    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + data.days);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    const result = await db
      .select({
        payment: payments,
        borrowerName: borrowers.name,
        borrowerMobile: borrowers.mobile,
        loanPrimaryAmount: loans.primaryAmount,
      })
      .from(payments)
      .innerJoin(loans, eq(payments.loanId, loans.id))
      .innerJoin(borrowers, eq(loans.borrowerId, borrowers.id))
      .where(
        and(
          or(eq(payments.status, 'pending'), eq(payments.status, 'partial')),
          gte(payments.dueDate, today),
          lte(payments.dueDate, futureDateStr),
        ),
      )
      .orderBy(payments.dueDate);

    return result.map((r) => ({
      ...r.payment,
      borrowerName: r.borrowerName,
      borrowerMobile: r.borrowerMobile,
      loanPrimaryAmount: r.loanPrimaryAmount,
    }));
  });

export const listOverduePayments = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await getAuthenticatedUser();
  requireRole(user, ['admin', 'manager']);

  const today = new Date().toISOString().split('T')[0];

  const result = await db
    .select({
      payment: payments,
      borrowerName: borrowers.name,
      borrowerMobile: borrowers.mobile,
      loanPrimaryAmount: loans.primaryAmount,
    })
    .from(payments)
    .innerJoin(loans, eq(payments.loanId, loans.id))
    .innerJoin(borrowers, eq(loans.borrowerId, borrowers.id))
    .where(
      and(
        or(
          eq(payments.status, 'pending'),
          eq(payments.status, 'partial'),
          eq(payments.status, 'overdue'),
        ),
        lte(payments.dueDate, today),
      ),
    )
    .orderBy(payments.dueDate);

  return result.map((r) => ({
    ...r.payment,
    borrowerName: r.borrowerName,
    borrowerMobile: r.borrowerMobile,
    loanPrimaryAmount: r.loanPrimaryAmount,
  }));
});

export const listRecentPayments = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await getAuthenticatedUser();
  requireRole(user, ['admin', 'manager']);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

  const result = await db
    .select({
      payment: payments,
      borrowerName: borrowers.name,
      borrowerMobile: borrowers.mobile,
      loanPrimaryAmount: loans.primaryAmount,
    })
    .from(payments)
    .innerJoin(loans, eq(payments.loanId, loans.id))
    .innerJoin(borrowers, eq(loans.borrowerId, borrowers.id))
    .where(
      and(
        or(eq(payments.status, 'paid'), eq(payments.status, 'waived')),
        gte(payments.paidDate, dateStr),
      ),
    )
    .orderBy(desc(payments.paidDate));

  return result.map((r) => ({
    ...r.payment,
    borrowerName: r.borrowerName,
    borrowerMobile: r.borrowerMobile,
    loanPrimaryAmount: r.loanPrimaryAmount,
  }));
});

export const revertPayment = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const d = data as { paymentId: string; reason?: string };
    if (!d.paymentId) throw new Error('Payment ID is required');
    return { paymentId: d.paymentId, reason: d.reason || '' };
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requireRole(user, ['admin', 'manager']);

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
