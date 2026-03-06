import { c as createServerRpc, d as db, p as payments, a as capitalPoolLog, l as loans, b as borrowers } from "./index-BN40sTes.mjs";
import { m as markPaymentSchema, a as markWaivedSchema } from "./payment-jMyh0Ybg.mjs";
import { a as getAuthenticatedUser } from "./auth-BKEQ4cPm.mjs";
import { r as requireRole } from "./roleGuard-MoSFikSq.mjs";
import { c as createServerFn } from "./index.mjs";
import { e as eq, d as desc, b as and, a as sql, l as lte, g as gte, o as or } from "../_libs/drizzle-orm.mjs";
import "../_chunks/_libs/@neondatabase/serverless.mjs";
import "../_libs/joi.mjs";
import "../_chunks/_libs/react.mjs";
import "../_chunks/_libs/@hapi/hoek.mjs";
import "../_chunks/_libs/@hapi/formula.mjs";
import "../_chunks/_libs/@hapi/pinpoint.mjs";
import "../_chunks/_libs/@hapi/topo.mjs";
import "../_chunks/_libs/@hapi/address.mjs";
import "url";
import "util";
import "../_chunks/_libs/@hapi/tlds.mjs";
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
import "../_chunks/_libs/@tanstack/react-router.mjs";
import "../_chunks/_libs/react-dom.mjs";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/tiny-warning.mjs";
const listPaymentsByLoan_createServerFn_handler = createServerRpc({
  id: "ddff522c8bb9ccb79a21689bc8a037e0bc5c0b03976bfad9aea68f21c22e49e0",
  name: "listPaymentsByLoan",
  filename: "src/server/functions/payments.ts"
}, (opts) => listPaymentsByLoan.__executeServer(opts));
const listPaymentsByLoan = createServerFn({
  method: "GET"
}).inputValidator((data) => {
  const loanId = data.loanId;
  if (!loanId) throw new Error("Loan ID is required");
  return {
    loanId
  };
}).handler(listPaymentsByLoan_createServerFn_handler, async ({
  data
}) => {
  const user = await getAuthenticatedUser();
  requireRole(user, ["admin", "manager"]);
  const result = await db.select().from(payments).where(eq(payments.loanId, data.loanId)).orderBy(payments.installmentNumber);
  return result;
});
const markPaymentPaid_createServerFn_handler = createServerRpc({
  id: "59c15f949d8dc113c6350ef01cf363752f956a68f708bdf6f58805fda162f915",
  name: "markPaymentPaid",
  filename: "src/server/functions/payments.ts"
}, (opts) => markPaymentPaid.__executeServer(opts));
const markPaymentPaid = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const {
    error,
    value
  } = markPaymentSchema.validate(data, {
    abortEarly: false
  });
  if (error) {
    throw new Error(error.details.map((d) => d.message).join(", "));
  }
  return value;
}).handler(markPaymentPaid_createServerFn_handler, async ({
  data
}) => {
  const user = await getAuthenticatedUser();
  requireRole(user, ["admin", "manager"]);
  const [payment] = await db.select().from(payments).where(eq(payments.id, data.paymentId)).limit(1);
  if (!payment) throw new Error("Payment not found");
  const amountDue = parseFloat(payment.amountDue);
  const isFullPayment = data.amountPaid >= amountDue;
  const newStatus = isFullPayment ? "paid" : "partial";
  const [updated] = await db.update(payments).set({
    amountPaid: data.amountPaid.toFixed(2),
    paidDate: data.paidDate,
    status: newStatus,
    paymentMethod: data.paymentMethod,
    notes: data.notes || null,
    recordedBy: user.id,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(payments.id, data.paymentId)).returning();
  const lastEntry = await db.select({
    runningBalance: capitalPoolLog.runningBalance
  }).from(capitalPoolLog).orderBy(desc(capitalPoolLog.createdAt)).limit(1);
  const currentBalance = lastEntry.length > 0 ? parseFloat(lastEntry[0].runningBalance) : 0;
  await db.insert(capitalPoolLog).values({
    eventType: "collection",
    amount: data.amountPaid.toFixed(2),
    runningBalance: (currentBalance + data.amountPaid).toFixed(2),
    referenceLoanId: payment.loanId,
    referencePaymentId: payment.id,
    recordedBy: user.id
  });
  if (isFullPayment) {
    const unpaid = await db.select({
      id: payments.id
    }).from(payments).where(and(eq(payments.loanId, payment.loanId), sql`${payments.status} NOT IN ('paid', 'waived')`)).limit(1);
    if (unpaid.length === 0) {
      await db.update(loans).set({
        status: "completed",
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(loans.id, payment.loanId));
    }
  }
  return updated;
});
const markPaymentPartial_createServerFn_handler = createServerRpc({
  id: "8f1f91b5598343ef977b6533acc047b67e13f3f1a85847038c59286ffbae29bf",
  name: "markPaymentPartial",
  filename: "src/server/functions/payments.ts"
}, (opts) => markPaymentPartial.__executeServer(opts));
const markPaymentPartial = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const {
    error,
    value
  } = markPaymentSchema.validate(data, {
    abortEarly: false
  });
  if (error) {
    throw new Error(error.details.map((d) => d.message).join(", "));
  }
  return value;
}).handler(markPaymentPartial_createServerFn_handler, async ({
  data
}) => {
  const user = await getAuthenticatedUser();
  requireRole(user, ["admin", "manager"]);
  const [payment] = await db.select().from(payments).where(eq(payments.id, data.paymentId)).limit(1);
  if (!payment) throw new Error("Payment not found");
  const [updated] = await db.update(payments).set({
    amountPaid: data.amountPaid.toFixed(2),
    paidDate: data.paidDate,
    status: "partial",
    paymentMethod: data.paymentMethod,
    notes: data.notes || null,
    recordedBy: user.id,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(payments.id, data.paymentId)).returning();
  const lastEntry = await db.select({
    runningBalance: capitalPoolLog.runningBalance
  }).from(capitalPoolLog).orderBy(desc(capitalPoolLog.createdAt)).limit(1);
  const currentBalance = lastEntry.length > 0 ? parseFloat(lastEntry[0].runningBalance) : 0;
  await db.insert(capitalPoolLog).values({
    eventType: "collection",
    amount: data.amountPaid.toFixed(2),
    runningBalance: (currentBalance + data.amountPaid).toFixed(2),
    referenceLoanId: payment.loanId,
    referencePaymentId: payment.id,
    recordedBy: user.id
  });
  return updated;
});
const markPaymentWaived_createServerFn_handler = createServerRpc({
  id: "24c97fbfdfdea218d73ce4fe6aa689f5ada68672778a74aac52cdfdc7f376115",
  name: "markPaymentWaived",
  filename: "src/server/functions/payments.ts"
}, (opts) => markPaymentWaived.__executeServer(opts));
const markPaymentWaived = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const {
    error,
    value
  } = markWaivedSchema.validate(data, {
    abortEarly: false
  });
  if (error) {
    throw new Error(error.details.map((d) => d.message).join(", "));
  }
  return value;
}).handler(markPaymentWaived_createServerFn_handler, async ({
  data
}) => {
  const user = await getAuthenticatedUser();
  requireRole(user, ["admin", "manager"]);
  const [updated] = await db.update(payments).set({
    status: "waived",
    notes: data.notes,
    recordedBy: user.id,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(payments.id, data.paymentId)).returning();
  if (!updated) throw new Error("Payment not found");
  const unpaid = await db.select({
    id: payments.id
  }).from(payments).where(and(eq(payments.loanId, updated.loanId), sql`${payments.status} NOT IN ('paid', 'waived')`)).limit(1);
  if (unpaid.length === 0) {
    await db.update(loans).set({
      status: "completed",
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(loans.id, updated.loanId));
  }
  return updated;
});
const listUpcomingPayments_createServerFn_handler = createServerRpc({
  id: "27af284ac630b437bdbda95142b0abfbefc64d0f0ff24c5f855347ceaec795df",
  name: "listUpcomingPayments",
  filename: "src/server/functions/payments.ts"
}, (opts) => listUpcomingPayments.__executeServer(opts));
const listUpcomingPayments = createServerFn({
  method: "GET"
}).inputValidator((data) => {
  const days = data.days || 7;
  return {
    days
  };
}).handler(listUpcomingPayments_createServerFn_handler, async ({
  data
}) => {
  const user = await getAuthenticatedUser();
  requireRole(user, ["admin", "manager"]);
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const futureDate = /* @__PURE__ */ new Date();
  futureDate.setDate(futureDate.getDate() + data.days);
  const futureDateStr = futureDate.toISOString().split("T")[0];
  const result = await db.select({
    payment: payments,
    borrowerName: borrowers.name,
    borrowerMobile: borrowers.mobile,
    loanPrimaryAmount: loans.primaryAmount
  }).from(payments).innerJoin(loans, eq(payments.loanId, loans.id)).innerJoin(borrowers, eq(loans.borrowerId, borrowers.id)).where(and(or(eq(payments.status, "pending"), eq(payments.status, "partial")), gte(payments.dueDate, today), lte(payments.dueDate, futureDateStr))).orderBy(payments.dueDate);
  return result.map((r) => ({
    ...r.payment,
    borrowerName: r.borrowerName,
    borrowerMobile: r.borrowerMobile,
    loanPrimaryAmount: r.loanPrimaryAmount
  }));
});
const listOverduePayments_createServerFn_handler = createServerRpc({
  id: "eb9a0a8f9fbcc6d36f47887494e1861a79a993fc0634c5fab13f0bfadff2181f",
  name: "listOverduePayments",
  filename: "src/server/functions/payments.ts"
}, (opts) => listOverduePayments.__executeServer(opts));
const listOverduePayments = createServerFn({
  method: "GET"
}).handler(listOverduePayments_createServerFn_handler, async () => {
  const user = await getAuthenticatedUser();
  requireRole(user, ["admin", "manager"]);
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const result = await db.select({
    payment: payments,
    borrowerName: borrowers.name,
    borrowerMobile: borrowers.mobile,
    loanPrimaryAmount: loans.primaryAmount
  }).from(payments).innerJoin(loans, eq(payments.loanId, loans.id)).innerJoin(borrowers, eq(loans.borrowerId, borrowers.id)).where(and(or(eq(payments.status, "pending"), eq(payments.status, "partial"), eq(payments.status, "overdue")), lte(payments.dueDate, today))).orderBy(payments.dueDate);
  return result.map((r) => ({
    ...r.payment,
    borrowerName: r.borrowerName,
    borrowerMobile: r.borrowerMobile,
    loanPrimaryAmount: r.loanPrimaryAmount
  }));
});
const listRecentPayments_createServerFn_handler = createServerRpc({
  id: "467a4add2f8162dd6e91ae88288e840b44a1533c7629bd97404f41a8e480e67b",
  name: "listRecentPayments",
  filename: "src/server/functions/payments.ts"
}, (opts) => listRecentPayments.__executeServer(opts));
const listRecentPayments = createServerFn({
  method: "GET"
}).handler(listRecentPayments_createServerFn_handler, async () => {
  const user = await getAuthenticatedUser();
  requireRole(user, ["admin", "manager"]);
  const thirtyDaysAgo = /* @__PURE__ */ new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dateStr = thirtyDaysAgo.toISOString().split("T")[0];
  const result = await db.select({
    payment: payments,
    borrowerName: borrowers.name,
    borrowerMobile: borrowers.mobile,
    loanPrimaryAmount: loans.primaryAmount
  }).from(payments).innerJoin(loans, eq(payments.loanId, loans.id)).innerJoin(borrowers, eq(loans.borrowerId, borrowers.id)).where(and(or(eq(payments.status, "paid"), eq(payments.status, "waived")), gte(payments.paidDate, dateStr))).orderBy(desc(payments.paidDate));
  return result.map((r) => ({
    ...r.payment,
    borrowerName: r.borrowerName,
    borrowerMobile: r.borrowerMobile,
    loanPrimaryAmount: r.loanPrimaryAmount
  }));
});
const revertPayment_createServerFn_handler = createServerRpc({
  id: "1b7c1f44b08991f3daafb4a2ca8a6a97cedb276718c2c33042cf5e1c0dda0be9",
  name: "revertPayment",
  filename: "src/server/functions/payments.ts"
}, (opts) => revertPayment.__executeServer(opts));
const revertPayment = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const d = data;
  if (!d.paymentId) throw new Error("Payment ID is required");
  return {
    paymentId: d.paymentId,
    reason: d.reason || ""
  };
}).handler(revertPayment_createServerFn_handler, async ({
  data
}) => {
  const user = await getAuthenticatedUser();
  requireRole(user, ["admin", "manager"]);
  const [payment] = await db.select().from(payments).where(eq(payments.id, data.paymentId)).limit(1);
  if (!payment) throw new Error("Payment not found");
  if (payment.status === "pending" || payment.status === "overdue") {
    throw new Error("PAYMENT_ALREADY_PENDING");
  }
  const previousAmountPaid = parseFloat(payment.amountPaid);
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const revertedStatus = payment.dueDate <= today ? "overdue" : "pending";
  const [updated] = await db.update(payments).set({
    status: revertedStatus,
    amountPaid: "0.00",
    paidDate: null,
    paymentMethod: null,
    notes: data.reason ? `Reverted: ${data.reason}` : "Reverted",
    recordedBy: user.id,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(payments.id, data.paymentId)).returning();
  if (previousAmountPaid > 0) {
    const lastEntry = await db.select({
      runningBalance: capitalPoolLog.runningBalance
    }).from(capitalPoolLog).orderBy(desc(capitalPoolLog.createdAt)).limit(1);
    const currentBalance = lastEntry.length > 0 ? parseFloat(lastEntry[0].runningBalance) : 0;
    await db.insert(capitalPoolLog).values({
      eventType: "collection",
      amount: (-previousAmountPaid).toFixed(2),
      runningBalance: (currentBalance - previousAmountPaid).toFixed(2),
      referenceLoanId: payment.loanId,
      referencePaymentId: payment.id,
      notes: data.reason ? `Reversal: ${data.reason}` : "Payment reversal",
      recordedBy: user.id
    });
  }
  const [loan] = await db.select({
    id: loans.id,
    status: loans.status
  }).from(loans).where(eq(loans.id, payment.loanId)).limit(1);
  if (loan && loan.status === "completed") {
    await db.update(loans).set({
      status: "active",
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(loans.id, loan.id));
  }
  return updated;
});
const bulkUpdateOverdueStatus_createServerFn_handler = createServerRpc({
  id: "ee8c6974c87a15c3f851649bc5854dcd90080d025f99584e051c0187379c58b5",
  name: "bulkUpdateOverdueStatus",
  filename: "src/server/functions/payments.ts"
}, (opts) => bulkUpdateOverdueStatus.__executeServer(opts));
const bulkUpdateOverdueStatus = createServerFn({
  method: "POST"
}).handler(bulkUpdateOverdueStatus_createServerFn_handler, async () => {
  const user = await getAuthenticatedUser();
  requireRole(user, ["admin", "manager"]);
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const result = await db.update(payments).set({
    status: "overdue",
    updatedAt: /* @__PURE__ */ new Date()
  }).where(and(eq(payments.status, "pending"), lte(payments.dueDate, today))).returning({
    id: payments.id
  });
  return {
    updated: result.length
  };
});
export {
  bulkUpdateOverdueStatus_createServerFn_handler,
  listOverduePayments_createServerFn_handler,
  listPaymentsByLoan_createServerFn_handler,
  listRecentPayments_createServerFn_handler,
  listUpcomingPayments_createServerFn_handler,
  markPaymentPaid_createServerFn_handler,
  markPaymentPartial_createServerFn_handler,
  markPaymentWaived_createServerFn_handler,
  revertPayment_createServerFn_handler
};
