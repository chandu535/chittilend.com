import { c as createServerRpc, d as db, a as capitalPoolLog, b as borrowers, l as loans } from "./index-BAKXOWjL.mjs";
import { a as getAuthenticatedUser } from "./auth-DpeO-HDl.mjs";
import { r as requireRole } from "./roleGuard-MoSFikSq.mjs";
import { c as createServerFn } from "./index.mjs";
import { d as desc, e as eq, g as gte, l as lte, b as and } from "../_libs/drizzle-orm.mjs";
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
const getCapitalBalance_createServerFn_handler = createServerRpc({
  id: "cc11e524a6bf78967b71a718ff53a0b27099805b4c84beb43f5eb652c045bf60",
  name: "getCapitalBalance",
  filename: "src/server/functions/capital.ts"
}, (opts) => getCapitalBalance.__executeServer(opts));
const getCapitalBalance = createServerFn({
  method: "GET"
}).handler(getCapitalBalance_createServerFn_handler, async () => {
  const user = await getAuthenticatedUser();
  requireRole(user, ["admin", "manager"]);
  const lastEntry = await db.select({
    runningBalance: capitalPoolLog.runningBalance
  }).from(capitalPoolLog).orderBy(desc(capitalPoolLog.createdAt)).limit(1);
  return {
    balance: lastEntry.length > 0 ? parseFloat(lastEntry[0].runningBalance) : 0
  };
});
const getCapitalLog_createServerFn_handler = createServerRpc({
  id: "727e83e3ba9a6397583d7296131d393575f763162e2298693aa6ed034b64ed61",
  name: "getCapitalLog",
  filename: "src/server/functions/capital.ts"
}, (opts) => getCapitalLog.__executeServer(opts));
const getCapitalLog = createServerFn({
  method: "GET"
}).inputValidator((data) => {
  const input = data;
  return {
    dateFrom: input.dateFrom || null,
    dateTo: input.dateTo || null,
    eventType: input.eventType || null
  };
}).handler(getCapitalLog_createServerFn_handler, async ({
  data
}) => {
  const user = await getAuthenticatedUser();
  requireRole(user, ["admin", "manager"]);
  const conditions = [];
  if (data.eventType && data.eventType !== "all") {
    conditions.push(eq(capitalPoolLog.eventType, data.eventType));
  }
  if (data.dateFrom) {
    conditions.push(gte(capitalPoolLog.eventDate, new Date(data.dateFrom)));
  }
  if (data.dateTo) {
    const endDate = new Date(data.dateTo);
    endDate.setHours(23, 59, 59, 999);
    conditions.push(lte(capitalPoolLog.eventDate, endDate));
  }
  const result = await db.select({
    log: capitalPoolLog,
    loanBorrowerName: borrowers.name
  }).from(capitalPoolLog).leftJoin(loans, eq(capitalPoolLog.referenceLoanId, loans.id)).leftJoin(borrowers, eq(loans.borrowerId, borrowers.id)).where(conditions.length > 0 ? and(...conditions) : void 0).orderBy(desc(capitalPoolLog.createdAt)).limit(100);
  return result.map((r) => ({
    ...r.log,
    borrowerName: r.loanBorrowerName
  }));
});
const addInvestment_createServerFn_handler = createServerRpc({
  id: "b5b76cdd5bf2632d2f5e9c07e7f1cee2047f8cc7b538a73532cb598e98860fc0",
  name: "addInvestment",
  filename: "src/server/functions/capital.ts"
}, (opts) => addInvestment.__executeServer(opts));
const addInvestment = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const input = data;
  if (!input.amount || input.amount <= 0) {
    throw new Error("Investment amount must be positive");
  }
  return {
    amount: input.amount,
    notes: input.notes || null
  };
}).handler(addInvestment_createServerFn_handler, async ({
  data
}) => {
  const user = await getAuthenticatedUser();
  requireRole(user, ["admin"]);
  const lastEntry = await db.select({
    runningBalance: capitalPoolLog.runningBalance
  }).from(capitalPoolLog).orderBy(desc(capitalPoolLog.createdAt)).limit(1);
  const currentBalance = lastEntry.length > 0 ? parseFloat(lastEntry[0].runningBalance) : 0;
  const [entry] = await db.insert(capitalPoolLog).values({
    eventType: "investment",
    amount: data.amount.toFixed(2),
    runningBalance: (currentBalance + data.amount).toFixed(2),
    notes: data.notes,
    recordedBy: user.id
  }).returning();
  return entry;
});
export {
  addInvestment_createServerFn_handler,
  getCapitalBalance_createServerFn_handler,
  getCapitalLog_createServerFn_handler
};
