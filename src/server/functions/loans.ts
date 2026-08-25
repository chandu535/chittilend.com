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
import { allocateReceipts, respreadSchedule, shiftDueDate, type ScheduleStatus } from '@/lib/schedule';
import { DEFAULTS, LIMITS } from '@/lib/constants';

type NextPayment = {
  id: string;
  installmentNumber: number;
  dueDate: string;
  amountDue: string;
  amountPaid: string;
  status: 'pending' | 'partial' | 'overdue';
};

/**
 * How the loans list is ordered, as the database sees it.
 *
 * This rule used to live in the browser, sorting whichever rows a page happened to hold.
 * That is only an ordering if you can see everything: with 437 loans in four buckets, the
 * rows fetched at page size 10 and at page size 50 sort into different first pages, so
 * changing the page size reshuffled the list. Ordering is a property of the data, not of
 * how much of it was asked for, so it belongs in the query beside the LIMIT it survives.
 *
 * Four bands, in the order somebody working the book cares about them:
 *
 *   0  something due on or before the end of this month — the collections round
 *   1  a loan issued this month, not yet due
 *   2  running, due later, or with no instalment left to collect
 *   3  settled, which is history
 *
 * "This month" is IST. The server runs on UTC, where the last five and a half hours of the
 * Indian day still read as yesterday — and a loan sliding between bands at 18:30 would look
 * like the list reordering itself.
 */
const displayPriority = sql`(
  CASE
    WHEN ${loans.status} = 'completed' THEN 3
    WHEN (SELECT p.due_date FROM payments p
          WHERE p.loan_id = ${loans.id} AND p.status NOT IN ('paid','waived')
          ORDER BY p.installment_number ASC LIMIT 1) IS NULL THEN 2
    WHEN (SELECT p.due_date FROM payments p
          WHERE p.loan_id = ${loans.id} AND p.status NOT IN ('paid','waived')
          ORDER BY p.installment_number ASC LIMIT 1)
         <= (date_trunc('month', (now() AT TIME ZONE 'Asia/Kolkata')) + interval '1 month - 1 day')::date THEN 0
    WHEN ${loans.dateGiven} < date_trunc('month', (now() AT TIME ZONE 'Asia/Kolkata'))::date THEN 2
    ELSE 1
  END
)`;

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
            displayPriority,
            desc(loans.createdAt),
            desc(loans.loanNumber),
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
          displayPriority,
          desc(loans.createdAt),
          desc(loans.loanNumber),
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

/**
 * Brings a loan into existence: the row, its whole instalment schedule, and the
 * disbursement it puts through the capital pool.
 *
 * Extracted from createLoan because there are now two ways a loan starts — someone filling
 * in the form, and an admin approving cash a collector already handed over at a doorstep.
 * Those must produce identical loans. Left as two code paths they would drift, and the
 * drift would be in how a debt is calculated, which is the last place it should happen.
 *
 * Takes a user id rather than reading the session, so the caller owns the permission check.
 * Both callers make one; this is not the place it belongs.
 */
export async function issueLoan(
  input: {
    borrowerId: string;
    dateGiven: string;
    primaryAmount: number;
    tenureMonths: number;
    paymentFrequency: 'monthly' | 'weekly';
    serviceChargePercent: number;
    markupPercent: number;
    notes?: string | null;
  },
  userId: string,
) {
  // A loan must never be issued against a borrower who is in the Bin — it would be
  // invisible the moment it was created, since the list hides a loan whose borrower is
  // binned. There was no check of any kind here before.
  const [borrower] = await db
    .select({ id: borrowers.id })
    .from(borrowers)
    .where(and(eq(borrowers.id, input.borrowerId), borrowerLive))
    .limit(1);
  if (!borrower) throw new Error('Borrower not found');

  // Server-side calculation — NEVER trust client values
  const calc = calculateLoan(
    input.primaryAmount,
    input.tenureMonths,
    input.paymentFrequency,
    input.serviceChargePercent,
    input.markupPercent,
  );

  const startMonth = calculateStartMonth(new Date(input.dateGiven));

  const [loan] = await db
    .insert(loans)
    .values({
      borrowerId: input.borrowerId,
      dateGiven: input.dateGiven,
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
      notes: input.notes || null,
      createdBy: userId,
    })
    .returning();

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
  // soft-delete-exempt: the capital ledger records cash that genuinely moved and its
  // running balance cannot be recomputed, so it reads every prior entry regardless.
  const lastEntry = await db
    .select({ runningBalance: capitalPoolLog.runningBalance })
    .from(capitalPoolLog)
    .orderBy(desc(capitalPoolLog.createdAt))
    .limit(1);

  const currentBalance = lastEntry.length > 0 ? parseFloat(lastEntry[0].runningBalance) : 0;

  await db.insert(capitalPoolLog).values({
    eventType: 'disbursement',
    amount: calc.primaryAmount.toFixed(2),
    runningBalance: (currentBalance - calc.primaryAmount).toFixed(2),
    referenceLoanId: loan.id,
    recordedBy: userId,
  });

  return loan;
}

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

    const loan = await issueLoan({
      borrowerId: data.borrowerId,
      dateGiven: data.dateGiven instanceof Date
        ? data.dateGiven.toISOString().split('T')[0]
        : data.dateGiven,
      primaryAmount: data.primaryAmount,
      tenureMonths: data.tenureMonths,
      paymentFrequency: data.paymentFrequency,
      serviceChargePercent: data.serviceChargePercent,
      markupPercent: data.markupPercent,
      notes: data.notes,
    }, user.id);

    await requestSheetSync();
    return loan;
  });

/**
 * Every loan ever handed out, newest first.
 *
 * The payments screen answers "who owes what" from the instalment side. This is the other
 * half of the same ledger — the money that went out — and it is deliberately unbounded
 * where the recent-payments list is a rolling window. A disbursement is a fact about the
 * business that does not stop being true after thirty days, and the whole point of the tab
 * is being able to look back over all of them.
 *
 * Carries only what the row shows: who, their number, how much, and when.
 */
export const listGivenLoans = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => {
    const d = (data ?? {}) as { page?: number; limit?: number };
    return { page: d.page || 1, limit: d.limit || DEFAULTS.ITEMS_PER_PAGE };
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requireRole(user, ['admin', 'manager']);

    const offset = (data.page - 1) * data.limit;

    const [rows, totalResult] = await Promise.all([
      db
        .select({
          id: loans.id,
          loanNumber: loans.loanNumber,
          dateGiven: loans.dateGiven,
          // What was physically handed over, which is what the rest of the app calls
          // "Amount Given" — the principal less the service charge kept back from it.
          amountGiven: loans.amountUserReceived,
          primaryAmount: loans.primaryAmount,
          status: loans.status,
          borrowerName: borrowers.name,
          borrowerNameTelugu: borrowers.nameTelugu,
          borrowerMobile: borrowers.mobile,
          borrowerPhotoUrl: borrowers.profilePhotoUrl,
        })
        .from(loans)
        .innerJoin(borrowers, eq(loans.borrowerId, borrowers.id))
        .where(and(loanLive, borrowerLive))
        // Two keys, because the imported ledger is month-precision on 254 rows: without the
        // loan number as a tie-break, everything given in the same month would come back in
        // whatever order the planner chose and the list would reshuffle between pages.
        .orderBy(desc(loans.dateGiven), desc(loans.loanNumber))
        .limit(data.limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(loans)
        .innerJoin(borrowers, eq(loans.borrowerId, borrowers.id))
        .where(and(loanLive, borrowerLive)),
    ]);

    const total = totalResult[0].count;

    return { items: rows, total, page: data.page, limit: data.limit, totalPages: Math.ceil(total / data.limit) };
  });

/**
 * Rewrites a loan's terms, and everything that follows from them.
 *
 * The amount, the frequency, the start date and the number of instalments are not four
 * independent fields — each one changes the schedule, and the schedule is what the borrower
 * actually owes month by month. So this recomputes the whole loan the way createLoan would
 * have, rather than patching columns: a loan corrected here is indistinguishable from one
 * entered correctly to begin with.
 *
 * Money already collected is never touched. It is laid across the new instalments by
 * allocateReceipts — earliest first, each instalment taking the date of the receipt that
 * cleared it — so the receipts stay facts while only the plan changes. An edit can therefore
 * reopen a settled loan or settle an open one, and both are correct: the status follows the
 * money, as it does everywhere else.
 *
 * The capital disbursement follows the principal, because the pool recorded what was handed
 * over and a corrected principal means a corrected handover.
 */
export const updateLoanTerms = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const d = data as {
      id?: string;
      primaryAmount?: number;
      paymentFrequency?: string;
      totalInstallments?: number;
      dateGiven?: string;
      notes?: string | null;
    };

    if (!d.id) throw new Error('Loan ID is required');

    const amount = Number(d.primaryAmount);
    if (!Number.isFinite(amount) || amount < LIMITS.MIN_LOAN_AMOUNT || amount > LIMITS.MAX_LOAN_AMOUNT) {
      throw new Error(`Amount must be between ₹${LIMITS.MIN_LOAN_AMOUNT.toLocaleString('en-IN')} and ₹${LIMITS.MAX_LOAN_AMOUNT.toLocaleString('en-IN')}`);
    }

    const frequency = d.paymentFrequency;
    if (frequency !== 'monthly' && frequency !== 'weekly') throw new Error('Frequency must be monthly or weekly');

    const count = Number(d.totalInstallments);
    // The ceiling is the same one addInstallments enforces: high enough for any real
    // arrangement, low enough that a typo cannot write thousands of rows.
    if (!Number.isInteger(count) || count < 1 || count > 120) {
      throw new Error('Instalments must be between 1 and 120');
    }

    if (!d.dateGiven || !/^\d{4}-\d{2}-\d{2}$/.test(d.dateGiven)) throw new Error('Date given is required');

    return {
      id: d.id,
      primaryAmount: amount,
      paymentFrequency: frequency,
      totalInstallments: count,
      dateGiven: d.dateGiven,
      notes: d.notes ?? null,
    };
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requirePermission(user, 'loans.write');

    const loan = await db.query.loans.findFirst({
      where: and(eq(loans.id, data.id), loanLive),
      with: { payments: { orderBy: (p, { asc }) => [asc(p.installmentNumber)] } },
    });
    if (!loan) throw new Error('Loan not found');

    // The house terms stay as they were on this loan. They are policy rather than
    // per-loan detail, and changing them is not what this screen is for.
    const svc = parseFloat(loan.serviceChargePercent);
    const markup = parseFloat(loan.markupPercent);

    const handedOver = data.primaryAmount * (1 - svc / 100);
    const repayable = data.primaryAmount * (1 + markup / 100);
    const instalment = repayable / data.totalInstallments;

    // Re-narrowed: the validator proves this is one of the two, but the literal type does
    // not survive the server-function boundary, which serialises its input.
    const frequency = data.paymentFrequency as 'monthly' | 'weekly';

    const startMonth = calculateStartMonth(new Date(data.dateGiven));
    const schedule = generatePaymentSchedule(startMonth, repayable, data.totalInstallments, frequency);

    // Every rupee that actually arrived, with the day it arrived on. A waived instalment
    // carries no money, so it contributes nothing here — it is forgiven, not paid.
    const receipts = loan.payments
      .filter((p) => parseFloat(p.amountPaid) > 0)
      .map((p) => ({ amount: parseFloat(p.amountPaid), date: p.paidDate as string | null }));

    const allocated = allocateReceipts(
      schedule.map((s) => ({ installmentNumber: s.installmentNumber, amountDue: s.amountDue })),
      receipts,
    );

    const collected = allocated.reduce((sum, r) => sum + r.amountPaid, 0);
    const settled = collected >= repayable - 0.01;

    const [disbursement] = await db
      .select({ id: capitalPoolLog.id })
      .from(capitalPoolLog)
      .where(and(eq(capitalPoolLog.referenceLoanId, loan.id), eq(capitalPoolLog.eventType, 'disbursement')))
      .limit(1);

    /*
      One batch, which Neon runs as a single transaction. The old instalments are deleted
      and the new ones inserted, so a half-applied edit would leave the loan with a partial
      schedule owing less than it does — the same reason addInstallments batches.
    */
    const writes = [
      db.delete(payments).where(eq(payments.loanId, loan.id)),

      ...allocated.map((row, i) => db.insert(payments).values({
        loanId: loan.id,
        installmentNumber: row.installmentNumber,
        dueDate: schedule[i].dueDate.toISOString().split('T')[0],
        amountDue: row.amountDue.toFixed(2),
        amountPaid: row.amountPaid.toFixed(2),
        paidDate: row.paidDate,
        status: row.status === 'waived' ? 'pending' as const : row.status,
        paymentMethod: row.amountPaid > 0 ? 'cash' as const : null,
        recordedBy: row.amountPaid > 0 ? user.id : null,
      })),

      db.update(loans).set({
        dateGiven: data.dateGiven,
        startMonth: startMonth.toISOString().split('T')[0],
        primaryAmount: data.primaryAmount.toFixed(2),
        serviceChargeAmount: (data.primaryAmount * (svc / 100)).toFixed(2),
        amountUserReceived: handedOver.toFixed(2),
        totalRepayment: repayable.toFixed(2),
        installmentAmount: instalment.toFixed(2),
        totalInstallments: data.totalInstallments,
        profitAmount: (repayable - data.primaryAmount).toFixed(2),
        paymentFrequency: frequency,
        // Months are what the column means, so a weekly loan reports its length in months.
        tenureMonths: frequency === 'monthly'
          ? data.totalInstallments
          : Math.ceil(data.totalInstallments / 4),
        // A defaulted loan stays defaulted: that is somebody's decision about a borrower,
        // not something arithmetic should overwrite. Everything else follows the money.
        status: loan.status === 'defaulted' ? 'defaulted' as const : settled ? 'completed' as const : 'active' as const,
        notes: data.notes,
        updatedAt: new Date(),
      }).where(and(eq(loans.id, loan.id), loanLive)),

      ...(disbursement
        ? [db.update(capitalPoolLog)
            .set({ amount: data.primaryAmount.toFixed(2) })
            .where(eq(capitalPoolLog.id, disbursement.id))]
        : []),
    ] as const;

    await db.batch(writes as unknown as [typeof writes[number], ...typeof writes[number][]]);

    await requestSheetSync();

    const [updated] = await db
      .select()
      .from(loans)
      .where(and(eq(loans.id, data.id), loanLive))
      .limit(1);
    return updated;
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
        borrowerId: loans.borrowerId,
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
