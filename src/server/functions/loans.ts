import { createServerFn } from '@tanstack/react-start';
import { eq, and, desc, count, gte, lte, ilike, sql } from 'drizzle-orm';
import { db } from '../db';
import { loans, payments, borrowers, capitalPoolLog } from '../db/schema';
import { createLoanSchema } from '../validators/loan';
import { getAuthenticatedUser } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';
import { calculateLoan, calculateStartMonth, generatePaymentSchedule } from '@/lib/calculations';
import { DEFAULTS } from '@/lib/constants';

type NextPayment = {
  id: string;
  installmentNumber: number;
  dueDate: string;
  amountDue: string;
  amountPaid: string;
  status: 'pending' | 'partial' | 'overdue';
};

export const listLoans = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => {
    const d = data as {
      page?: number;
      limit?: number;
      status?: string;
      borrowerId?: string;
      dateFrom?: string;
      dateTo?: string;
      search?: string;
    };
    return {
      page: d.page || 1,
      limit: d.limit || DEFAULTS.ITEMS_PER_PAGE,
      status: d.status || '',
      borrowerId: d.borrowerId || '',
      dateFrom: d.dateFrom || '',
      dateTo: d.dateTo || '',
      search: d.search || '',
    };
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requireRole(user, ['admin', 'manager']);

    const offset = (data.page - 1) * data.limit;
    const conditions = [];

    if (data.status && data.status !== 'all') {
      conditions.push(eq(loans.status, data.status as 'active' | 'completed' | 'defaulted' | 'extended'));
    }

    if (data.borrowerId) {
      conditions.push(eq(loans.borrowerId, data.borrowerId));
    }

    if (data.dateFrom) {
      conditions.push(gte(loans.dateGiven, data.dateFrom));
    }

    if (data.dateTo) {
      conditions.push(lte(loans.dateGiven, data.dateTo));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // If searching by borrower name, join
    if (data.search) {
      const pattern = `%${data.search}%`;
      const searchCondition = ilike(borrowers.name, pattern);
      const fullWhere = where ? and(where, searchCondition) : searchCondition;

      const [items, totalResult] = await Promise.all([
        db
          .select({
            loan: loans,
            borrowerName: borrowers.name,
            borrowerMobile: borrowers.mobile,
            borrowerArea: borrowers.area,
            borrowerPhotoUrl: borrowers.profilePhotoUrl,
            nextPayment: sql<NextPayment | null>`(SELECT json_build_object('id',p.id::text,'installmentNumber',p.installment_number,'dueDate',p.due_date::text,'amountDue',p.amount_due::text,'amountPaid',p.amount_paid::text,'status',p.status::text) FROM payments p WHERE p.loan_id=${loans.id} AND p.status NOT IN ('paid','waived') ORDER BY p.installment_number ASC LIMIT 1)`,
            paidInstallments: sql<number>`(SELECT COUNT(*) FROM payments p WHERE p.loan_id=${loans.id} AND p.status = 'paid')`,
            paidAmount: sql<string>`COALESCE((SELECT SUM(p.amount_paid) FROM payments p WHERE p.loan_id=${loans.id} AND p.status IN ('paid', 'partial')), 0)`,
          })
          .from(loans)
          .innerJoin(borrowers, eq(loans.borrowerId, borrowers.id))
          .where(fullWhere)
          .orderBy(
            sql`(SELECT CASE WHEN p.status = 'overdue' THEN 0 ELSE 1 END FROM payments p WHERE p.loan_id=${loans.id} AND p.status NOT IN ('paid','waived') ORDER BY p.installment_number ASC LIMIT 1) ASC NULLS LAST`,
            desc(loans.createdAt),
          )
          .limit(data.limit)
          .offset(offset),
        db
          .select({ count: count() })
          .from(loans)
          .innerJoin(borrowers, eq(loans.borrowerId, borrowers.id))
          .where(fullWhere),
      ]);

      return {
        items: items.map((r) => ({
          ...r.loan,
          borrowerName: r.borrowerName,
          borrowerMobile: r.borrowerMobile,
          borrowerArea: r.borrowerArea,
          borrowerPhotoUrl: r.borrowerPhotoUrl,
          nextPayment: r.nextPayment,
          paidInstallments: Number(r.paidInstallments),
          paidAmount: r.paidAmount,
        })),
        total: totalResult[0].count,
        page: data.page,
        limit: data.limit,
        totalPages: Math.ceil(totalResult[0].count / data.limit),
      };
    }

    const [items, totalResult] = await Promise.all([
      db
        .select({
          loan: loans,
          borrowerName: borrowers.name,
          borrowerMobile: borrowers.mobile,
          borrowerArea: borrowers.area,
          borrowerPhotoUrl: borrowers.profilePhotoUrl,
          nextPayment: sql<NextPayment | null>`(SELECT json_build_object('id',p.id::text,'installmentNumber',p.installment_number,'dueDate',p.due_date::text,'amountDue',p.amount_due::text,'amountPaid',p.amount_paid::text,'status',p.status::text) FROM payments p WHERE p.loan_id=${loans.id} AND p.status NOT IN ('paid','waived') ORDER BY p.installment_number ASC LIMIT 1)`,
          paidInstallments: sql<number>`(SELECT COUNT(*) FROM payments p WHERE p.loan_id=${loans.id} AND p.status = 'paid')`,
          paidAmount: sql<string>`COALESCE((SELECT SUM(p.amount_paid) FROM payments p WHERE p.loan_id=${loans.id} AND p.status IN ('paid', 'partial')), 0)`,
        })
        .from(loans)
        .innerJoin(borrowers, eq(loans.borrowerId, borrowers.id))
        .where(where)
        .orderBy(
          sql`(SELECT CASE WHEN p.status = 'overdue' THEN 0 ELSE 1 END FROM payments p WHERE p.loan_id=${loans.id} AND p.status NOT IN ('paid','waived') ORDER BY p.installment_number ASC LIMIT 1) ASC NULLS LAST`,
          desc(loans.createdAt),
        )
        .limit(data.limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(loans)
        .where(where),
    ]);

    return {
      items: items.map((r) => ({
        ...r.loan,
        borrowerName: r.borrowerName,
        borrowerMobile: r.borrowerMobile,
        borrowerArea: r.borrowerArea,
        borrowerPhotoUrl: r.borrowerPhotoUrl,
        nextPayment: r.nextPayment,
        paidInstallments: Number(r.paidInstallments),
        paidAmount: r.paidAmount,
      })),
      total: totalResult[0].count,
      page: data.page,
      limit: data.limit,
      totalPages: Math.ceil(totalResult[0].count / data.limit),
    };
  });

export const getLoanById = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => {
    const id = (data as { id: string }).id;
    if (!id) throw new Error('Loan ID is required');
    return { id };
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requireRole(user, ['admin', 'manager']);

    const loan = await db.query.loans.findFirst({
      where: eq(loans.id, data.id),
      with: {
        borrower: {
          columns: {
            id: true,
            name: true,
            mobile: true,
            area: true,
            profilePhotoUrl: true,
          },
        },
        payments: {
          orderBy: (payments, { asc }) => [asc(payments.installmentNumber)],
        },
      },
    });

    if (!loan) throw new Error('Loan not found');

    return loan;
  });

export const createLoan = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const { error, value } = createLoanSchema.validate(data, { abortEarly: false });
    if (error) {
      const messages = error.details.map((d) => d.message).join(', ');
      throw new Error(messages);
    }
    return value;
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requireRole(user, ['admin', 'manager']);

    // Server-side calculation — NEVER trust client values
    const calc = calculateLoan(
      data.primaryAmount,
      data.tenureMonths,
      data.paymentFrequency,
      data.serviceChargePercent,
      data.markupPercent,
    );

    const dateGiven = new Date(data.dateGiven);
    const startMonth = calculateStartMonth(dateGiven);

    // Insert loan
    const [loan] = await db
      .insert(loans)
      .values({
        borrowerId: data.borrowerId,
        dateGiven: data.dateGiven instanceof Date
          ? data.dateGiven.toISOString().split('T')[0]
          : data.dateGiven,
        startMonth: startMonth.toISOString().split('T')[0],
        primaryAmount: calc.primaryAmount.toFixed(2),
        serviceChargePercent: calc.serviceChargePercent.toFixed(2),
        serviceChargeAmount: calc.serviceChargeAmount.toFixed(2),
        amountUserReceived: calc.amountUserReceives.toFixed(2),
        markupPercent: calc.markupPercent.toFixed(2),
        totalRepayment: calc.totalRepayment.toFixed(2),
        tenureMonths: calc.tenureMonths,
        paymentFrequency: calc.paymentFrequency,
        installmentAmount: calc.installmentAmount.toFixed(2),
        totalInstallments: calc.totalInstallments,
        profitAmount: calc.profitAmount.toFixed(2),
        status: 'active',
        notes: data.notes || null,
        createdBy: user.id,
      })
      .returning();

    // Generate and insert payment schedule
    const schedule = generatePaymentSchedule(
      startMonth,
      calc.totalRepayment,
      calc.totalInstallments,
      calc.paymentFrequency,
    );

    for (const scheduled of schedule) {
      await db.insert(payments).values({
        loanId: loan.id,
        installmentNumber: scheduled.installmentNumber,
        dueDate: scheduled.dueDate.toISOString().split('T')[0],
        amountDue: scheduled.amountDue.toFixed(2),
        amountPaid: '0.00',
        status: 'pending',
      });
    }

    // Capital pool: disbursement entry
    // Get current running balance
    const lastEntry = await db
      .select({ runningBalance: capitalPoolLog.runningBalance })
      .from(capitalPoolLog)
      .orderBy(desc(capitalPoolLog.createdAt))
      .limit(1);

    const currentBalance = lastEntry.length > 0
      ? parseFloat(lastEntry[0].runningBalance)
      : 0;

    await db.insert(capitalPoolLog).values({
      eventType: 'disbursement',
      amount: calc.primaryAmount.toFixed(2),
      runningBalance: (currentBalance - calc.primaryAmount).toFixed(2),
      referenceLoanId: loan.id,
      recordedBy: user.id,
    });

    return loan;
  });

export const updateLoan = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const d = data as { id: string; notes?: string; status?: string };
    if (!d.id) throw new Error('Loan ID is required');
    if (d.status && !['active', 'completed', 'defaulted', 'extended'].includes(d.status)) {
      throw new Error('Invalid status');
    }
    return d;
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requireRole(user, ['admin', 'manager']);

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status) updateData.status = data.status;

    const [updated] = await db
      .update(loans)
      .set(updateData)
      .where(eq(loans.id, data.id))
      .returning();

    if (!updated) throw new Error('Loan not found');

    return updated;
  });

export const extendTenure = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const d = data as { id: string; newTenureMonths: number };
    if (!d.id) throw new Error('Loan ID is required');
    if (!d.newTenureMonths || d.newTenureMonths < 1) {
      throw new Error('New tenure must be at least 1 month');
    }
    return d;
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requireRole(user, ['admin', 'manager']);

    const loan = await db.query.loans.findFirst({
      where: eq(loans.id, data.id),
      with: { payments: true },
    });

    if (!loan) throw new Error('Loan not found');

    const oldTotalInstallments = loan.totalInstallments;
    const totalRepayment = parseFloat(loan.totalRepayment);

    // Calculate new installment count
    const newTotalInstallments = loan.paymentFrequency === 'monthly'
      ? data.newTenureMonths
      : data.newTenureMonths * 4;

    if (newTotalInstallments <= oldTotalInstallments) {
      throw new Error('New tenure must be longer than current tenure');
    }

    // Recalculate installment amount for remaining balance
    const paidAmount = loan.payments
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + parseFloat(p.amountPaid), 0);

    const remainingAmount = totalRepayment - paidAmount;
    const paidInstallments = loan.payments.filter((p) => p.status === 'paid').length;
    const newRemainingInstallments = newTotalInstallments - paidInstallments;
    const newInstallmentAmount = remainingAmount / newRemainingInstallments;

    // Update unpaid payments with new amount
    const unpaidPayments = loan.payments.filter((p) => p.status !== 'paid');
    for (const payment of unpaidPayments) {
      await db
        .update(payments)
        .set({ amountDue: newInstallmentAmount.toFixed(2) })
        .where(eq(payments.id, payment.id));
    }

    // Add new payment rows
    const lastPayment = loan.payments[loan.payments.length - 1];
    const lastDueDate = new Date(lastPayment.dueDate);

    for (let i = oldTotalInstallments + 1; i <= newTotalInstallments; i++) {
      const dueDate = new Date(lastDueDate);
      const offset = i - oldTotalInstallments;
      if (loan.paymentFrequency === 'monthly') {
        dueDate.setMonth(dueDate.getMonth() + offset);
      } else {
        dueDate.setDate(dueDate.getDate() + offset * 7);
      }

      await db.insert(payments).values({
        loanId: loan.id,
        installmentNumber: i,
        dueDate: dueDate.toISOString().split('T')[0],
        amountDue: newInstallmentAmount.toFixed(2),
        amountPaid: '0.00',
        status: 'pending',
      });
    }

    // Update loan record
    const [updated] = await db
      .update(loans)
      .set({
        tenureMonths: data.newTenureMonths,
        totalInstallments: newTotalInstallments,
        installmentAmount: newInstallmentAmount.toFixed(2),
        status: 'extended',
        updatedAt: new Date(),
      })
      .where(eq(loans.id, data.id))
      .returning();

    return updated;
  });

export const changeStatus = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const d = data as { id: string; status: string };
    if (!d.id) throw new Error('Loan ID is required');
    if (!['active', 'defaulted'].includes(d.status)) {
      throw new Error('Status must be active or defaulted');
    }
    return d as { id: string; status: 'active' | 'defaulted' };
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requireRole(user, ['admin', 'manager']);

    const [updated] = await db
      .update(loans)
      .set({ status: data.status, updatedAt: new Date() })
      .where(eq(loans.id, data.id))
      .returning();

    if (!updated) throw new Error('Loan not found');
    return updated;
  });
