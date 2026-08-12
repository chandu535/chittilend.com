import { createServerFn } from '@tanstack/react-start';
import { eq, and, desc, count, gte, lte, sql } from 'drizzle-orm';
import { db } from '../db';
import { loans, payments, borrowers, capitalPoolLog } from '../db/schema';
import { createLoanSchema } from '../validators/loan';
import { getAuthenticatedUser } from '../middleware/auth';
import { requestSheetSync } from '../sheets/sync';
import { requireRole, requirePermission } from '../middleware/roleGuard';
import { loanSearchCondition, loanSearchRelevance } from '../db/search';
import { borrowerLive, loanLive } from '../db/softDelete';
import { calculateLoan, calculateStartMonth, generatePaymentSchedule } from '@/lib/calculations';
import { respreadSchedule, shiftDueDate, type ScheduleStatus } from '@/lib/schedule';
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
      searchTelugu?: string[];
    };
    return {
      page: d.page || 1,
      limit: d.limit || DEFAULTS.ITEMS_PER_PAGE,
      status: d.status || '',
      borrowerId: d.borrowerId || '',
      dateFrom: d.dateFrom || '',
      dateTo: d.dateTo || '',
      search: d.search || '',
      searchTelugu: (d.searchTelugu ?? []).filter((t) => typeof t === 'string' && t.trim()).slice(0, 3),
    };
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requireRole(user, ['admin', 'manager']);

    const offset = (data.page - 1) * data.limit;

    // The next instalment still owing, per loan — the same one the rows, the sort, the
    // overdue filter and the overdue count all read, so they can never disagree.
    const nextStatus = sql`(SELECT p.status FROM payments p WHERE p.loan_id=${loans.id} AND p.status NOT IN ('paid','waived') ORDER BY p.installment_number ASC LIMIT 1)`;
    const nextDue = sql`(SELECT p.due_date FROM payments p WHERE p.loan_id=${loans.id} AND p.status NOT IN ('paid','waived') ORDER BY p.installment_number ASC LIMIT 1)`;
    // "Today" in IST. The server runs on UTC, where CURRENT_DATE is still yesterday for
    // the last five and a half hours of the Indian day.
    const istToday = sql`(now() AT TIME ZONE 'Asia/Kolkata')::date`;

    // Seeded with the live predicates, which every branch below inherits: the rows, the
    // total, both facet queries and the urgency counts all build from these two arrays.
    // Both tables, because a list row joins them and either being binned hides the row.
    const conditions = [loanLive, borrowerLive];

    // "Overdue" is not a loan status — it is a loan whose next instalment is overdue, so
    // it cuts across active and extended rather than sitting beside them.
    if (data.status === 'overdue') {
      conditions.push(sql`${nextStatus} = 'overdue'`);
    } else if (data.status && data.status !== 'all') {
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

    const liveWhere = and(...conditions);

    // Facet counts for the status chips. Deliberately ignores the status filter itself
    // so each chip shows its own total and the numbers do not shift when you switch
    // between them; every other active filter (search, dates, borrower) still applies.
    const facetConditions = [loanLive, borrowerLive];
    if (data.borrowerId) facetConditions.push(eq(loans.borrowerId, data.borrowerId));
    if (data.dateFrom) facetConditions.push(gte(loans.dateGiven, data.dateFrom));
    if (data.dateTo) facetConditions.push(lte(loans.dateGiven, data.dateTo));
    const searchCondition = loanSearchCondition(data.search, data.searchTelugu);
    // While searching, the closest name comes first; the overdue-first ordering resumes
    // below it, and takes over entirely once the search box is empty.
    const relevance = loanSearchRelevance(data.search, data.searchTelugu);
    if (searchCondition) facetConditions.push(searchCondition);

    const liveFacetWhere = and(...facetConditions);

    // Counted over the whole filtered set, not the loaded page. Deriving these on the
    // client counted only the rows in hand, so desktop capped them at the page size while
    // mobile's infinite scroll grew them with every page appended.
    const [facetRows, urgencyRows] = await Promise.all([
      db
        .select({ status: loans.status, count: count() })
        .from(loans)
        .innerJoin(borrowers, eq(loans.borrowerId, borrowers.id))
        .where(liveFacetWhere)
        .groupBy(loans.status),
      db
        .select({
          overdue: sql<number>`COUNT(*) FILTER (WHERE ${nextStatus} = 'overdue')`,
          dueToday: sql<number>`COUNT(*) FILTER (WHERE ${nextStatus} <> 'overdue' AND ${nextDue} = ${istToday})`,
        })
        .from(loans)
        .innerJoin(borrowers, eq(loans.borrowerId, borrowers.id))
        .where(liveFacetWhere),
    ]);

    const urgencyCounts = {
      overdue: Number(urgencyRows[0]?.overdue ?? 0),
      dueToday: Number(urgencyRows[0]?.dueToday ?? 0),
    };

    const statusCounts = {
      all: 0,
      active: 0,
      overdue: 0,
      completed: 0,
      defaulted: 0,
      extended: 0,
    } as Record<'all' | 'active' | 'overdue' | 'completed' | 'defaulted' | 'extended', number>;
    for (const row of facetRows) {
      statusCounts[row.status] = row.count;
      statusCounts.all += row.count;
    }
    // Set after the loop, never added into `all`: an overdue loan is also an active one,
    // so counting it again would make the chips sum to more than the list holds.
    statusCounts.overdue = urgencyCounts.overdue;

    // Searching joins borrowers, so it needs its own branch.
    if (searchCondition) {
      const liveFullWhere = liveWhere && searchCondition ? and(liveWhere, searchCondition) : (searchCondition ?? liveWhere);

      const [items, totalResult] = await Promise.all([
        db
          .select({
            loan: loans,
            borrowerName: borrowers.name,
            borrowerNameTelugu: borrowers.nameTelugu,
            borrowerMobile: borrowers.mobile,
            borrowerArea: borrowers.area,
            borrowerPhotoUrl: borrowers.profilePhotoUrl,
            nextPayment: sql<NextPayment | null>`(SELECT json_build_object('id',p.id::text,'installmentNumber',p.installment_number,'dueDate',p.due_date::text,'amountDue',p.amount_due::text,'amountPaid',p.amount_paid::text,'status',p.status::text) FROM payments p WHERE p.loan_id=${loans.id} AND p.status NOT IN ('paid','waived') ORDER BY p.installment_number ASC LIMIT 1)`,
            paidInstallments: sql<number>`(SELECT COUNT(*) FROM payments p WHERE p.loan_id=${loans.id} AND p.status = 'paid')`,
            paidAmount: sql<string>`COALESCE((SELECT SUM(p.amount_paid) FROM payments p WHERE p.loan_id=${loans.id} AND p.status IN ('paid', 'partial')), 0)`,
          })
          .from(loans)
          .innerJoin(borrowers, eq(loans.borrowerId, borrowers.id))
          .where(liveFullWhere)
          .orderBy(
            ...(relevance ? [desc(relevance)] : []),
            sql`(SELECT CASE WHEN p.status = 'overdue' THEN 0 ELSE 1 END FROM payments p WHERE p.loan_id=${loans.id} AND p.status NOT IN ('paid','waived') ORDER BY p.installment_number ASC LIMIT 1) ASC NULLS LAST`,
            desc(loans.createdAt),
          )
          .limit(data.limit)
          .offset(offset),
        db
          .select({ count: count() })
          .from(loans)
          .innerJoin(borrowers, eq(loans.borrowerId, borrowers.id))
          .where(liveFullWhere),
      ]);

      return {
        items: items.map((r) => ({
          ...r.loan,
          borrowerName: r.borrowerName,
          borrowerNameTelugu: r.borrowerNameTelugu,
          borrowerMobile: r.borrowerMobile,
          borrowerArea: r.borrowerArea,
          borrowerPhotoUrl: r.borrowerPhotoUrl,
          nextPayment: r.nextPayment,
          paidInstallments: Number(r.paidInstallments),
          paidAmount: r.paidAmount,
        })),
        total: totalResult[0].count,
        statusCounts,
        urgencyCounts,
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
            borrowerNameTelugu: borrowers.nameTelugu,
          borrowerMobile: borrowers.mobile,
          borrowerArea: borrowers.area,
          borrowerPhotoUrl: borrowers.profilePhotoUrl,
          nextPayment: sql<NextPayment | null>`(SELECT json_build_object('id',p.id::text,'installmentNumber',p.installment_number,'dueDate',p.due_date::text,'amountDue',p.amount_due::text,'amountPaid',p.amount_paid::text,'status',p.status::text) FROM payments p WHERE p.loan_id=${loans.id} AND p.status NOT IN ('paid','waived') ORDER BY p.installment_number ASC LIMIT 1)`,
          paidInstallments: sql<number>`(SELECT COUNT(*) FROM payments p WHERE p.loan_id=${loans.id} AND p.status = 'paid')`,
          paidAmount: sql<string>`COALESCE((SELECT SUM(p.amount_paid) FROM payments p WHERE p.loan_id=${loans.id} AND p.status IN ('paid', 'partial')), 0)`,
        })
        .from(loans)
        .innerJoin(borrowers, eq(loans.borrowerId, borrowers.id))
        .where(liveWhere)
        .orderBy(
          sql`(SELECT CASE WHEN p.status = 'overdue' THEN 0 ELSE 1 END FROM payments p WHERE p.loan_id=${loans.id} AND p.status NOT IN ('paid','waived') ORDER BY p.installment_number ASC LIMIT 1) ASC NULLS LAST`,
          desc(loans.createdAt),
        )
        .limit(data.limit)
        .offset(offset),
      // Mirrors the row query's joins exactly. Counting from `loans` alone agreed with the
      // rows only because every loan has a borrower; the moment the where clause says
      // anything about the borrower, the count and the rows answer different questions and
      // the last page renders empty. The search branch above already joins.
      db
        .select({ count: count() })
        .from(loans)
        .innerJoin(borrowers, eq(loans.borrowerId, borrowers.id))
        .where(liveWhere),
    ]);

    return {
      items: items.map((r) => ({
        ...r.loan,
        borrowerName: r.borrowerName,
          borrowerNameTelugu: r.borrowerNameTelugu,
        borrowerMobile: r.borrowerMobile,
        borrowerArea: r.borrowerArea,
        borrowerPhotoUrl: r.borrowerPhotoUrl,
        nextPayment: r.nextPayment,
        paidInstallments: Number(r.paidInstallments),
        paidAmount: r.paidAmount,
      })),
      total: totalResult[0].count,
      statusCounts,
      urgencyCounts,
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

    // A binned loan reads as missing. The detail page turns that into "not found", and
    // for an admin adds a line pointing at the Bin so a bookmarked URL does not look like
    // the loan was lost.
    const loan = await db.query.loans.findFirst({
      where: and(eq(loans.id, data.id), loanLive),
      with: {
        borrower: {
          columns: {
            id: true,
            name: true,
            nameTelugu: true,
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
    requirePermission(user, 'loans.create');

    // A loan must never be issued against a borrower who is in the Bin — it would be
    // invisible the moment it was created, since the list hides a loan whose borrower is
    // binned. There was no check of any kind here before.
    const [borrower] = await db
      .select({ id: borrowers.id })
      .from(borrowers)
      .where(and(eq(borrowers.id, data.borrowerId), borrowerLive))
      .limit(1);
    if (!borrower) throw new Error('Borrower not found');

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

    await requestSheetSync();
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
    requirePermission(user, 'loans.write');

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status) updateData.status = data.status;

    const [updated] = await db
      .update(loans)
      .set(updateData)
      // Binned loans are not editable — a change here would edit one out from under
      // the Bin, and the restored row would not be what was removed.
      .where(and(eq(loans.id, data.id), loanLive))
      .returning();

    if (!updated) throw new Error('Loan not found');

    await requestSheetSync();
    return updated;
  });

/**
 * Gives a loan more instalments to be paid across, without giving it more debt.
 *
 * The schedule is a plan for collecting a fixed sum, so when five months run out with money
 * still owed, what has to grow is the number of slots — not the total. `respreadSchedule`
 * holds that line (sum(amountDue) === totalRepayment) and this function's only job is to
 * write down what it decided.
 *
 * Counted in instalments rather than months, which is what replaced `extendTenure`. Months
 * could not express "three more weeks" on a weekly loan at all: it multiplied by four, so
 * the smallest possible extension was a month of them.
 */
export const addInstallments = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const d = data as { id: string; totalInstallments: number };
    if (!d.id) throw new Error('Loan ID is required');
    if (!Number.isInteger(d.totalInstallments) || d.totalInstallments < 2) {
      throw new Error('Instalment count must be a whole number');
    }
    // A ceiling, because the only thing standing between a typo and 9,999 rows on a loan is
    // this line. Well above any real chitti and far below anything that would hurt.
    if (d.totalInstallments > 120) {
      throw new Error('A loan cannot have more than 120 instalments');
    }
    return d as { id: string; totalInstallments: number };
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requirePermission(user, 'loans.write');

    const loan = await db.query.loans.findFirst({
      where: and(eq(loans.id, data.id), loanLive),
      with: {
        // Ordered explicitly. The previous code read the last element of an unordered
        // relation to find the final due date, which is whatever Postgres felt like
        // returning — so appended instalments could be dated from the middle of the
        // schedule.
        payments: { orderBy: (p, { asc }) => [asc(p.installmentNumber)] },
      },
    });

    if (!loan) throw new Error('Loan not found');
    if (loan.status === 'completed') throw new Error('This loan is already repaid');

    const plan = respreadSchedule(
      loan.payments.map((p) => ({
        id: p.id,
        installmentNumber: p.installmentNumber,
        amountDue: parseFloat(p.amountDue),
        amountPaid: parseFloat(p.amountPaid),
        status: p.status as ScheduleStatus,
      })),
      data.totalInstallments,
      parseFloat(loan.totalRepayment),
    );

    const frequency = loan.paymentFrequency as 'monthly' | 'weekly';
    const lastDueDate = loan.payments[loan.payments.length - 1].dueDate as string;

    const writes = [
      ...plan.rows
        .filter((r) => !r.isNew && r.changed)
        .map((r) => db
          .update(payments)
          .set({ amountDue: r.amountDue.toFixed(2), status: r.status, updatedAt: new Date() })
          .where(eq(payments.id, r.id))),

      ...plan.rows
        .filter((r) => r.isNew)
        .map((r, i) => db.insert(payments).values({
          loanId: loan.id,
          installmentNumber: r.installmentNumber,
          dueDate: shiftDueDate(lastDueDate, i + 1, frequency),
          amountDue: r.amountDue.toFixed(2),
          amountPaid: '0.00',
          status: 'pending' as const,
        })),

      db
        .update(loans)
        .set({
          totalInstallments: data.totalInstallments,
          installmentAmount: plan.installmentAmount.toFixed(2),
          // Tenure follows the instalments so the two never disagree. On a weekly loan the
          // months are derived back, rounded up: six weekly instalments is two months of
          // them, and calling it one would understate the term.
          tenureMonths: frequency === 'monthly'
            ? data.totalInstallments
            : Math.ceil(data.totalInstallments / 4),
          // Re-spreading can settle the loan outright, by dropping a partially paid
          // instalment to what it already holds. Rare, but leaving it 'extended' would show
          // a repaid loan as still running.
          status: plan.outstanding <= 0.01 ? 'completed' as const : 'extended' as const,
          updatedAt: new Date(),
        })
        // Binned loans are not editable — a change here would edit one out from under
        // the Bin, and the restored row would not be what was removed.
        .where(and(eq(loans.id, data.id), loanLive)),
    ] as const;

    /*
      One batch, which Neon runs as a single transaction. This is the only place in the app
      that needs it: the writes are individually valid and collectively meaningless, since
      lowering the existing instalments without inserting the new ones would leave the loan
      owing less than it does. Sent separately, a connection dropped in the middle would
      quietly forgive the difference.
    */
    await db.batch(writes as unknown as [typeof writes[number], ...typeof writes[number][]]);

    await requestSheetSync();

    const [updated] = await db
      .select()
      .from(loans)
      .where(and(eq(loans.id, data.id), loanLive))
      .limit(1);
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
    requirePermission(user, 'loans.write');

    const [updated] = await db
      .update(loans)
      .set({ status: data.status, updatedAt: new Date() })
      // Binned loans are not editable — a change here would edit one out from under
      // the Bin, and the restored row would not be what was removed.
      .where(and(eq(loans.id, data.id), loanLive))
      .returning();

    if (!updated) throw new Error('Loan not found');

    await requestSheetSync();
    return updated;
  });

/**
 * Loans matching a term, for jumping straight to one.
 *
 * Deliberately not listLoans. That builds facet counts, urgency counts, a total and the
 * next instalment for every row — all of which a switcher throws away. This is the same
 * search rule against a handful of columns, so opening the box on a phone is one small
 * query rather than the whole list screen's worth of work.
 *
 * An empty query is valid and returns the most recent loans, so the box is useful before
 * anything is typed.
 */
export const searchLoans = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => {
    const d = data as { query?: string; queryTelugu?: string[]; limit?: number };
    return {
      query: (d.query ?? '').trim(),
      queryTelugu: (d.queryTelugu ?? []).filter((t) => typeof t === 'string' && t.trim()).slice(0, 3),
      limit: Math.min(d.limit ?? 20, 50),
    };
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requireRole(user, ['admin', 'manager']);

    const where = loanSearchCondition(data.query, data.queryTelugu);
    const relevance = loanSearchRelevance(data.query, data.queryTelugu);

    return db
      .select({
        id: loans.id,
        loanNumber: loans.loanNumber,
        status: loans.status,
        totalRepayment: loans.totalRepayment,
        dateGiven: loans.dateGiven,
        borrowerName: borrowers.name,
        borrowerNameTelugu: borrowers.nameTelugu,
        borrowerPhotoUrl: borrowers.profilePhotoUrl,
        borrowerArea: borrowers.area,
        paidAmount: sql<string>`COALESCE((SELECT SUM(p.amount_paid) FROM payments p WHERE p.loan_id = ${loans.id}), 0)`,
      })
      .from(loans)
      .innerJoin(borrowers, eq(loans.borrowerId, borrowers.id))
      // Both live predicates spelled out here rather than hoisted into a variable: the
      // soft-delete guard reads the statement text, and a name it cannot see is a filter
      // it cannot vouch for. AND-ed outside the search condition, which is an OR.
      .where(and(loanLive, borrowerLive, ...(where ? [where] : [])))
      // Closest match first while searching — which puts an exact loan number at the top —
      // and the newest loans first when the box is still empty.
      .orderBy(...(relevance ? [desc(relevance)] : []), desc(loans.loanNumber))
      .limit(data.limit);
  });
