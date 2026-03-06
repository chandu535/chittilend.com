import { c as createServerRpc, d as db, l as loans, a as capitalPoolLog, p as payments, b as borrowers } from "./index-BN40sTes.mjs";
import { a as getAuthenticatedUser } from "./auth-BKEQ4cPm.mjs";
import { r as requireRole } from "./roleGuard-MoSFikSq.mjs";
import { c as createServerFn } from "./index.mjs";
import { s as sum, e as eq, d as desc, a as sql, b as and, c as count, l as lte, g as gte } from "../_libs/drizzle-orm.mjs";
import "../_chunks/_libs/@neondatabase/serverless.mjs";
import "../_libs/jose.mjs";
import "../_chunks/_libs/@tanstack/history.mjs";
import "../_chunks/_libs/@tanstack/router-core.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/tiny-invariant.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "../_chunks/_libs/react.mjs";
import "../_chunks/_libs/@tanstack/react-router.mjs";
import "../_chunks/_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/tiny-warning.mjs";
const getDashboardSummary_createServerFn_handler = createServerRpc({
  id: "86137142a74d80357aac4d577d75d056d30cd47b41a4a6566b21623b672b5b1e",
  name: "getDashboardSummary",
  filename: "src/server/functions/analytics.ts"
}, (opts) => getDashboardSummary.__executeServer(opts));
const getDashboardSummary = createServerFn({
  method: "GET"
}).handler(getDashboardSummary_createServerFn_handler, async () => {
  const user = await getAuthenticatedUser();
  requireRole(user, ["admin", "manager"]);
  const now = /* @__PURE__ */ new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
  const [deployedResult, capitalResult, toCollectResult, profitResult, activeCountResult, overdueCountResult, monthCollectedResult, monthDisbursedResult] = await Promise.all([
    // Total Capital Deployed (sum of primary_amount for active loans)
    db.select({
      total: sum(loans.primaryAmount)
    }).from(loans).where(eq(loans.status, "active")),
    // Available Capital (latest running_balance from capital_pool_log)
    db.select({
      balance: capitalPoolLog.runningBalance
    }).from(capitalPoolLog).orderBy(desc(capitalPoolLog.createdAt)).limit(1),
    // Total to Collect (sum of remaining unpaid for active loans)
    db.select({
      total: sql`COALESCE(SUM(CAST(${payments.amountDue} AS numeric) - CAST(${payments.amountPaid} AS numeric)), 0)`
    }).from(payments).innerJoin(loans, eq(payments.loanId, loans.id)).where(and(eq(loans.status, "active"), sql`${payments.status} IN ('pending', 'partial', 'overdue')`)),
    // Total Profit Earned (from completed loans)
    db.select({
      total: sum(loans.profitAmount)
    }).from(loans).where(eq(loans.status, "completed")),
    // Active Loans Count
    db.select({
      count: count()
    }).from(loans).where(eq(loans.status, "active")),
    // Overdue Payments Count
    db.select({
      count: count()
    }).from(payments).where(eq(payments.status, "overdue")),
    // This Month Collections
    db.select({
      total: sum(payments.amountPaid)
    }).from(payments).where(and(gte(payments.paidDate, firstOfMonth), lte(payments.paidDate, lastOfMonth))),
    // This Month Disbursements
    db.select({
      total: sum(loans.primaryAmount)
    }).from(loans).where(and(gte(loans.dateGiven, firstOfMonth), lte(loans.dateGiven, lastOfMonth)))
  ]);
  return {
    totalDeployed: parseFloat(deployedResult[0].total || "0"),
    availableCapital: capitalResult.length > 0 ? parseFloat(capitalResult[0].balance) : 0,
    toCollect: parseFloat(toCollectResult[0].total || "0"),
    profitEarned: parseFloat(profitResult[0].total || "0"),
    activeLoans: activeCountResult[0].count,
    overduePayments: overdueCountResult[0].count,
    thisMonthCollected: parseFloat(monthCollectedResult[0].total || "0"),
    thisMonthDisbursed: parseFloat(monthDisbursedResult[0].total || "0")
  };
});
const getCashflowTimeline_createServerFn_handler = createServerRpc({
  id: "21372f13675cb16fef1a6a80ea212d700ad9e6d25ba796aa09565aef12f5cbe7",
  name: "getCashflowTimeline",
  filename: "src/server/functions/analytics.ts"
}, (opts) => getCashflowTimeline.__executeServer(opts));
const getCashflowTimeline = createServerFn({
  method: "GET"
}).inputValidator((data) => {
  const input = data;
  const now = /* @__PURE__ */ new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  return {
    dateFrom: input.dateFrom || sixMonthsAgo.toISOString().split("T")[0],
    dateTo: input.dateTo || now.toISOString().split("T")[0]
  };
}).handler(getCashflowTimeline_createServerFn_handler, async ({
  data
}) => {
  const user = await getAuthenticatedUser();
  requireRole(user, ["admin", "manager"]);
  const result = await db.select({
    month: sql`TO_CHAR(${capitalPoolLog.eventDate}, 'YYYY-MM')`,
    collections: sql`COALESCE(SUM(CASE WHEN ${capitalPoolLog.eventType} = 'collection' THEN CAST(${capitalPoolLog.amount} AS numeric) ELSE 0 END), 0)`,
    disbursements: sql`COALESCE(SUM(CASE WHEN ${capitalPoolLog.eventType} = 'disbursement' THEN CAST(${capitalPoolLog.amount} AS numeric) ELSE 0 END), 0)`,
    investments: sql`COALESCE(SUM(CASE WHEN ${capitalPoolLog.eventType} = 'investment' THEN CAST(${capitalPoolLog.amount} AS numeric) ELSE 0 END), 0)`
  }).from(capitalPoolLog).where(and(gte(capitalPoolLog.eventDate, new Date(data.dateFrom)), lte(capitalPoolLog.eventDate, new Date(data.dateTo)))).groupBy(sql`TO_CHAR(${capitalPoolLog.eventDate}, 'YYYY-MM')`).orderBy(sql`TO_CHAR(${capitalPoolLog.eventDate}, 'YYYY-MM')`);
  return result.map((r) => ({
    month: r.month,
    collections: parseFloat(r.collections),
    disbursements: parseFloat(r.disbursements),
    investments: parseFloat(r.investments)
  }));
});
const getAreaBreakdown_createServerFn_handler = createServerRpc({
  id: "6545723090aa22a2c36a2643951f144b7b594339e32a0728c055a08805363cae",
  name: "getAreaBreakdown",
  filename: "src/server/functions/analytics.ts"
}, (opts) => getAreaBreakdown.__executeServer(opts));
const getAreaBreakdown = createServerFn({
  method: "GET"
}).inputValidator((data) => {
  const input = data;
  return {
    dateFrom: input.dateFrom || null,
    dateTo: input.dateTo || null
  };
}).handler(getAreaBreakdown_createServerFn_handler, async ({
  data
}) => {
  const user = await getAuthenticatedUser();
  requireRole(user, ["admin", "manager"]);
  const conditions = [];
  if (data.dateFrom) conditions.push(gte(loans.dateGiven, data.dateFrom));
  if (data.dateTo) conditions.push(lte(loans.dateGiven, data.dateTo));
  const result = await db.select({
    area: borrowers.area,
    loanCount: count(loans.id),
    borrowerCount: sql`COUNT(DISTINCT ${borrowers.id})`,
    totalLent: sum(loans.primaryAmount),
    defaults: sql`SUM(CASE WHEN ${loans.status} = 'defaulted' THEN 1 ELSE 0 END)`
  }).from(loans).innerJoin(borrowers, eq(loans.borrowerId, borrowers.id)).where(conditions.length > 0 ? and(...conditions) : void 0).groupBy(borrowers.area).orderBy(sql`SUM(CAST(${loans.primaryAmount} AS numeric)) DESC`);
  return result.map((r) => ({
    area: r.area || "Unknown",
    loanCount: r.loanCount,
    borrowerCount: r.borrowerCount,
    totalLent: parseFloat(r.totalLent || "0"),
    defaults: r.defaults
  }));
});
const getBorrowerRanking_createServerFn_handler = createServerRpc({
  id: "659dadff243a85a5bac6d9206571e508b15d4876047c9dc57011f252f79ff484",
  name: "getBorrowerRanking",
  filename: "src/server/functions/analytics.ts"
}, (opts) => getBorrowerRanking.__executeServer(opts));
const getBorrowerRanking = createServerFn({
  method: "GET"
}).handler(getBorrowerRanking_createServerFn_handler, async () => {
  const user = await getAuthenticatedUser();
  requireRole(user, ["admin", "manager"]);
  const result = await db.select({
    id: borrowers.id,
    name: borrowers.name,
    mobile: borrowers.mobile,
    area: borrowers.area,
    totalPayments: count(payments.id),
    onTime: sql`SUM(CASE WHEN ${payments.status} = 'paid' AND ${payments.paidDate} <= ${payments.dueDate} THEN 1 ELSE 0 END)`,
    onTimePercent: sql`ROUND(
        SUM(CASE WHEN ${payments.status} = 'paid' AND ${payments.paidDate} <= ${payments.dueDate} THEN 1 ELSE 0 END)::numeric
        / NULLIF(COUNT(CASE WHEN ${payments.status} = 'paid' THEN 1 END), 0) * 100, 1
      )`,
    totalBorrowed: sum(loans.primaryAmount)
  }).from(borrowers).innerJoin(loans, eq(loans.borrowerId, borrowers.id)).innerJoin(payments, eq(payments.loanId, loans.id)).groupBy(borrowers.id, borrowers.name, borrowers.mobile, borrowers.area).orderBy(sql`ROUND(
      SUM(CASE WHEN ${payments.status} = 'paid' AND ${payments.paidDate} <= ${payments.dueDate} THEN 1 ELSE 0 END)::numeric
      / NULLIF(COUNT(CASE WHEN ${payments.status} = 'paid' THEN 1 END), 0) * 100, 1
    ) DESC NULLS LAST`);
  return result.map((r) => ({
    id: r.id,
    name: r.name,
    mobile: r.mobile,
    area: r.area || "Unknown",
    totalPayments: r.totalPayments,
    onTime: r.onTime,
    onTimePercent: r.onTimePercent ?? 0,
    totalBorrowed: parseFloat(r.totalBorrowed || "0")
  }));
});
const getStatusDistribution_createServerFn_handler = createServerRpc({
  id: "3e9c2c0571901ffe57141eacf53b8ed8d92472b720c79109737bf5aa8f528922",
  name: "getStatusDistribution",
  filename: "src/server/functions/analytics.ts"
}, (opts) => getStatusDistribution.__executeServer(opts));
const getStatusDistribution = createServerFn({
  method: "GET"
}).handler(getStatusDistribution_createServerFn_handler, async () => {
  const user = await getAuthenticatedUser();
  requireRole(user, ["admin", "manager"]);
  const result = await db.select({
    status: loans.status,
    count: count()
  }).from(loans).groupBy(loans.status);
  return result.map((r) => ({
    status: r.status,
    count: r.count
  }));
});
const getMonthlySnapshot_createServerFn_handler = createServerRpc({
  id: "dbd9f7730ebad79ea4ce6669df1e8129b72f2cacf83639e4d70a092dbc83e880",
  name: "getMonthlySnapshot",
  filename: "src/server/functions/analytics.ts"
}, (opts) => getMonthlySnapshot.__executeServer(opts));
const getMonthlySnapshot = createServerFn({
  method: "GET"
}).inputValidator((data) => {
  const input = data;
  return {
    month: input.month,
    year: input.year
  };
}).handler(getMonthlySnapshot_createServerFn_handler, async ({
  data
}) => {
  const user = await getAuthenticatedUser();
  requireRole(user, ["admin", "manager"]);
  const firstDay = new Date(data.year, data.month - 1, 1).toISOString().split("T")[0];
  const lastDay = new Date(data.year, data.month, 0).toISOString().split("T")[0];
  const [loansGiven, collected, newBorrowers] = await Promise.all([db.select({
    count: count(),
    total: sum(loans.primaryAmount)
  }).from(loans).where(and(gte(loans.dateGiven, firstDay), lte(loans.dateGiven, lastDay))), db.select({
    total: sum(payments.amountPaid)
  }).from(payments).where(and(gte(payments.paidDate, firstDay), lte(payments.paidDate, lastDay))), db.select({
    count: count()
  }).from(borrowers).where(and(gte(borrowers.createdAt, /* @__PURE__ */ new Date(`${firstDay}T00:00:00Z`)), lte(borrowers.createdAt, /* @__PURE__ */ new Date(`${lastDay}T23:59:59Z`))))]);
  return {
    month: data.month,
    year: data.year,
    loansGivenCount: loansGiven[0].count,
    loansGivenAmount: parseFloat(loansGiven[0].total || "0"),
    collected: parseFloat(collected[0].total || "0"),
    newBorrowers: newBorrowers[0].count
  };
});
const getRecentActivity_createServerFn_handler = createServerRpc({
  id: "e9a4555d7c844d233b99e27d25f094e7df13d73cd7572c2b83920784810d6748",
  name: "getRecentActivity",
  filename: "src/server/functions/analytics.ts"
}, (opts) => getRecentActivity.__executeServer(opts));
const getRecentActivity = createServerFn({
  method: "GET"
}).handler(getRecentActivity_createServerFn_handler, async () => {
  const user = await getAuthenticatedUser();
  requireRole(user, ["admin", "manager"]);
  const events = await db.select({
    id: capitalPoolLog.id,
    eventDate: capitalPoolLog.eventDate,
    eventType: capitalPoolLog.eventType,
    amount: capitalPoolLog.amount,
    referenceLoanId: capitalPoolLog.referenceLoanId,
    borrowerName: borrowers.name
  }).from(capitalPoolLog).leftJoin(loans, eq(capitalPoolLog.referenceLoanId, loans.id)).leftJoin(borrowers, eq(loans.borrowerId, borrowers.id)).orderBy(desc(capitalPoolLog.createdAt)).limit(10);
  return events.map((e) => ({
    id: e.id,
    eventDate: e.eventDate,
    eventType: e.eventType,
    amount: parseFloat(e.amount),
    loanId: e.referenceLoanId,
    borrowerName: e.borrowerName
  }));
});
export {
  getAreaBreakdown_createServerFn_handler,
  getBorrowerRanking_createServerFn_handler,
  getCashflowTimeline_createServerFn_handler,
  getDashboardSummary_createServerFn_handler,
  getMonthlySnapshot_createServerFn_handler,
  getRecentActivity_createServerFn_handler,
  getStatusDistribution_createServerFn_handler
};
