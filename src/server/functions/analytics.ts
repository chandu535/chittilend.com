import { createServerFn } from '@tanstack/react-start';
import { eq, and, gte, lte, sql, desc, count, sum } from 'drizzle-orm';
import { db } from '../db';
import { loans, payments, borrowers, capitalPoolLog } from '../db/schema';
import { getAuthenticatedUser } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';

// ============================================================
// Dashboard Summary — 8 metrics
// ============================================================

export const getDashboardSummary = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await getAuthenticatedUser();
  requireRole(user, ['admin', 'manager']);

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [
    deployedResult,
    capitalResult,
    toCollectResult,
    profitResult,
    activeCountResult,
    overdueCountResult,
    monthCollectedResult,
    monthDisbursedResult,
  ] = await Promise.all([
    // Total Capital Deployed (sum of primary_amount for active loans)
    db
      .select({ total: sum(loans.primaryAmount) })
      .from(loans)
      .where(eq(loans.status, 'active')),

    // Available Capital (latest running_balance from capital_pool_log)
    db
      .select({ balance: capitalPoolLog.runningBalance })
      .from(capitalPoolLog)
      .orderBy(desc(capitalPoolLog.createdAt))
      .limit(1),

    // Total to Collect (sum of remaining unpaid for active loans)
    db
      .select({
        total: sql<string>`COALESCE(SUM(CAST(${payments.amountDue} AS numeric) - CAST(${payments.amountPaid} AS numeric)), 0)`,
      })
      .from(payments)
      .innerJoin(loans, eq(payments.loanId, loans.id))
      .where(
        and(
          eq(loans.status, 'active'),
          sql`${payments.status} IN ('pending', 'partial', 'overdue')`,
        ),
      ),

    // Total Profit Earned (from completed loans)
    db
      .select({ total: sum(loans.profitAmount) })
      .from(loans)
      .where(eq(loans.status, 'completed')),

    // Active Loans Count
    db
      .select({ count: count() })
      .from(loans)
      .where(eq(loans.status, 'active')),

    // Overdue Payments Count
    db
      .select({ count: count() })
      .from(payments)
      .where(eq(payments.status, 'overdue')),

    // This Month Collections
    db
      .select({ total: sum(payments.amountPaid) })
      .from(payments)
      .where(
        and(
          gte(payments.paidDate, firstOfMonth),
          lte(payments.paidDate, lastOfMonth),
        ),
      ),

    // This Month Disbursements
    db
      .select({ total: sum(loans.primaryAmount) })
      .from(loans)
      .where(
        and(
          gte(loans.dateGiven, firstOfMonth),
          lte(loans.dateGiven, lastOfMonth),
        ),
      ),
  ]);

  return {
    totalDeployed: parseFloat(deployedResult[0].total || '0'),
    availableCapital: capitalResult.length > 0 ? parseFloat(capitalResult[0].balance) : 0,
    toCollect: parseFloat(toCollectResult[0].total || '0'),
    profitEarned: parseFloat(profitResult[0].total || '0'),
    activeLoans: activeCountResult[0].count,
    overduePayments: overdueCountResult[0].count,
    thisMonthCollected: parseFloat(monthCollectedResult[0].total || '0'),
    thisMonthDisbursed: parseFloat(monthDisbursedResult[0].total || '0'),
  };
});

// ============================================================
// Range Summary — flows within the selected period
// ============================================================

/**
 * Everything here is a *flow*: money that moved inside the selected window. That is what
 * makes these figures meaningful per range, unlike the point-in-time balances in
 * getDashboardSummary (outstanding, active count), which describe a moment rather than a
 * period and would be nonsense scoped to "this week".
 */
export const getRangeSummary = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => {
    const d = data as { dateFrom?: string; dateTo?: string };
    if (!d.dateFrom || !d.dateTo) throw new Error('A date range is required');
    return { dateFrom: d.dateFrom, dateTo: d.dateTo };
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requireRole(user, ['admin', 'manager']);

    const [disbursed, collected, profit, newBorrowers] = await Promise.all([
      db
        .select({ total: sum(loans.primaryAmount), count: count() })
        .from(loans)
        .where(and(gte(loans.dateGiven, data.dateFrom), lte(loans.dateGiven, data.dateTo))),

      db
        .select({ total: sum(payments.amountPaid), count: count() })
        .from(payments)
        .where(and(gte(payments.paidDate, data.dateFrom), lte(payments.paidDate, data.dateTo))),

      // Profit cannot be dated by loan completion — there is no completed_at column, and
      // a lump sum on completion would misrepresent when the money actually arrived.
      // Instead each rupee collected carries its loan's profit share, so profit is
      // recognised as it is received.
      db
        .select({
          total: sql<string>`COALESCE(SUM(
            CAST(${payments.amountPaid} AS numeric)
            * (CAST(${loans.profitAmount} AS numeric) / NULLIF(CAST(${loans.totalRepayment} AS numeric), 0))
          ), 0)`,
        })
        .from(payments)
        .innerJoin(loans, eq(payments.loanId, loans.id))
        .where(and(gte(payments.paidDate, data.dateFrom), lte(payments.paidDate, data.dateTo))),

      db
        .select({ count: count() })
        .from(borrowers)
        .where(and(
          gte(borrowers.createdAt, new Date(`${data.dateFrom}T00:00:00.000Z`)),
          lte(borrowers.createdAt, new Date(`${data.dateTo}T23:59:59.999Z`)),
        )),
    ]);

    return {
      disbursed: parseFloat(disbursed[0].total || '0'),
      loansGiven: disbursed[0].count,
      collected: parseFloat(collected[0].total || '0'),
      paymentsReceived: collected[0].count,
      profitRealized: parseFloat(profit[0].total || '0'),
      newBorrowers: newBorrowers[0].count,
    };
  });

// ============================================================
// Cashflow Timeline — monthly collections vs disbursements
// ============================================================

export const getCashflowTimeline = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => {
    const input = data as { dateFrom?: string; dateTo?: string };
    // Default to last 6 months
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    return {
      dateFrom: input.dateFrom || sixMonthsAgo.toISOString().split('T')[0],
      dateTo: input.dateTo || now.toISOString().split('T')[0],
    };
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requireRole(user, ['admin', 'manager']);

    const result = await db
      .select({
        month: sql<string>`TO_CHAR(${capitalPoolLog.eventDate}, 'YYYY-MM')`,
        collections: sql<string>`COALESCE(SUM(CASE WHEN ${capitalPoolLog.eventType} = 'collection' THEN CAST(${capitalPoolLog.amount} AS numeric) ELSE 0 END), 0)`,
        disbursements: sql<string>`COALESCE(SUM(CASE WHEN ${capitalPoolLog.eventType} = 'disbursement' THEN CAST(${capitalPoolLog.amount} AS numeric) ELSE 0 END), 0)`,
        investments: sql<string>`COALESCE(SUM(CASE WHEN ${capitalPoolLog.eventType} = 'investment' THEN CAST(${capitalPoolLog.amount} AS numeric) ELSE 0 END), 0)`,
      })
      .from(capitalPoolLog)
      .where(
        and(
          gte(capitalPoolLog.eventDate, new Date(data.dateFrom)),
          lte(capitalPoolLog.eventDate, new Date(data.dateTo)),
        ),
      )
      .groupBy(sql`TO_CHAR(${capitalPoolLog.eventDate}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${capitalPoolLog.eventDate}, 'YYYY-MM')`);

    return result.map((r) => ({
      month: r.month,
      collections: parseFloat(r.collections),
      disbursements: parseFloat(r.disbursements),
      investments: parseFloat(r.investments),
    }));
  });

// ============================================================
// Area Breakdown — loans grouped by area
// ============================================================

export const getAreaBreakdown = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => {
    const input = data as { dateFrom?: string; dateTo?: string };
    return {
      dateFrom: input.dateFrom || null,
      dateTo: input.dateTo || null,
    };
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requireRole(user, ['admin', 'manager']);

    const conditions = [];
    if (data.dateFrom) conditions.push(gte(loans.dateGiven, data.dateFrom));
    if (data.dateTo) conditions.push(lte(loans.dateGiven, data.dateTo));

    const result = await db
      .select({
        area: borrowers.area,
        loanCount: count(loans.id),
        borrowerCount: sql<number>`COUNT(DISTINCT ${borrowers.id})`,
        totalLent: sum(loans.primaryAmount),
        defaults: sql<number>`SUM(CASE WHEN ${loans.status} = 'defaulted' THEN 1 ELSE 0 END)`,
      })
      .from(loans)
      .innerJoin(borrowers, eq(loans.borrowerId, borrowers.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(borrowers.area)
      .orderBy(sql`SUM(CAST(${loans.primaryAmount} AS numeric)) DESC`);

    return result.map((r) => ({
      area: r.area || 'Unknown',
      loanCount: r.loanCount,
      borrowerCount: r.borrowerCount,
      totalLent: parseFloat(r.totalLent || '0'),
      defaults: r.defaults,
    }));
  });

// ============================================================
// Borrower Reliability Ranking
// ============================================================

export const getBorrowerRanking = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await getAuthenticatedUser();
  requireRole(user, ['admin', 'manager']);

  const result = await db
    .select({
      id: borrowers.id,
      name: borrowers.name,
      nameTelugu: borrowers.nameTelugu,
      mobile: borrowers.mobile,
      area: borrowers.area,
      totalPayments: count(payments.id),
      onTime: sql<number>`SUM(CASE WHEN ${payments.status} = 'paid' AND ${payments.paidDate} <= ${payments.dueDate} THEN 1 ELSE 0 END)`,
      onTimePercent: sql<number>`ROUND(
        SUM(CASE WHEN ${payments.status} = 'paid' AND ${payments.paidDate} <= ${payments.dueDate} THEN 1 ELSE 0 END)::numeric
        / NULLIF(COUNT(CASE WHEN ${payments.status} = 'paid' THEN 1 END), 0) * 100, 1
      )`,
      totalBorrowed: sum(loans.primaryAmount),
    })
    .from(borrowers)
    .innerJoin(loans, eq(loans.borrowerId, borrowers.id))
    .innerJoin(payments, eq(payments.loanId, loans.id))
    .groupBy(borrowers.id, borrowers.name, borrowers.nameTelugu, borrowers.mobile, borrowers.area)
    .orderBy(sql`ROUND(
      SUM(CASE WHEN ${payments.status} = 'paid' AND ${payments.paidDate} <= ${payments.dueDate} THEN 1 ELSE 0 END)::numeric
      / NULLIF(COUNT(CASE WHEN ${payments.status} = 'paid' THEN 1 END), 0) * 100, 1
    ) DESC NULLS LAST`);

  return result.map((r) => ({
    id: r.id,
    name: r.name,
    nameTelugu: r.nameTelugu,
    mobile: r.mobile,
    area: r.area || 'Unknown',
    totalPayments: r.totalPayments,
    onTime: r.onTime,
    onTimePercent: r.onTimePercent ?? 0,
    totalBorrowed: parseFloat(r.totalBorrowed || '0'),
  }));
});

// ============================================================
// Status Distribution — count of loans by status
// ============================================================

export const getStatusDistribution = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await getAuthenticatedUser();
  requireRole(user, ['admin', 'manager']);

  const result = await db
    .select({
      status: loans.status,
      count: count(),
    })
    .from(loans)
    .groupBy(loans.status);

  return result.map((r) => ({
    status: r.status,
    count: r.count,
  }));
});

// ============================================================
// Monthly Snapshot — detailed metrics for a specific month
// ============================================================

export const getMonthlySnapshot = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => {
    const input = data as { month: number; year: number };
    return {
      month: input.month,
      year: input.year,
    };
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requireRole(user, ['admin', 'manager']);

    const firstDay = new Date(data.year, data.month - 1, 1).toISOString().split('T')[0];
    const lastDay = new Date(data.year, data.month, 0).toISOString().split('T')[0];

    const [loansGiven, collected, newBorrowers] = await Promise.all([
      db
        .select({
          count: count(),
          total: sum(loans.primaryAmount),
        })
        .from(loans)
        .where(and(gte(loans.dateGiven, firstDay), lte(loans.dateGiven, lastDay))),

      db
        .select({ total: sum(payments.amountPaid) })
        .from(payments)
        .where(
          and(
            gte(payments.paidDate, firstDay),
            lte(payments.paidDate, lastDay),
          ),
        ),

      db
        .select({ count: count() })
        .from(borrowers)
        .where(
          and(
            gte(borrowers.createdAt, new Date(`${firstDay}T00:00:00Z`)),
            lte(borrowers.createdAt, new Date(`${lastDay}T23:59:59Z`)),
          ),
        ),
    ]);

    return {
      month: data.month,
      year: data.year,
      loansGivenCount: loansGiven[0].count,
      loansGivenAmount: parseFloat(loansGiven[0].total || '0'),
      collected: parseFloat(collected[0].total || '0'),
      newBorrowers: newBorrowers[0].count,
    };
  });

// ============================================================
// Recent Activity — last 10 events for dashboard feed
// ============================================================

export const getRecentActivity = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await getAuthenticatedUser();
  requireRole(user, ['admin', 'manager']);

  // Get recent capital pool events (which cover loans, payments, investments)
  const events = await db
    .select({
      id: capitalPoolLog.id,
      eventDate: capitalPoolLog.eventDate,
      eventType: capitalPoolLog.eventType,
      amount: capitalPoolLog.amount,
      referenceLoanId: capitalPoolLog.referenceLoanId,
      borrowerName: borrowers.name,
      borrowerNameTelugu: borrowers.nameTelugu,
    })
    .from(capitalPoolLog)
    .leftJoin(loans, eq(capitalPoolLog.referenceLoanId, loans.id))
    .leftJoin(borrowers, eq(loans.borrowerId, borrowers.id))
    .orderBy(desc(capitalPoolLog.createdAt))
    .limit(10);

  return events.map((e) => ({
    id: e.id,
    eventDate: e.eventDate,
    eventType: e.eventType,
    amount: parseFloat(e.amount),
    loanId: e.referenceLoanId,
    borrowerName: e.borrowerName,
    borrowerNameTelugu: e.borrowerNameTelugu,
  }));
});
