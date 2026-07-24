import { c as createServerRpc, d as db, b as borrowers, l as loans, p as payments } from "./index-BAKXOWjL.mjs";
import { c as createServerFn } from "./index.mjs";
import { e as eq } from "../_libs/drizzle-orm.mjs";
import "../_chunks/_libs/@neondatabase/serverless.mjs";
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
const getPortalData_createServerFn_handler = createServerRpc({
  id: "19c53245c787054aa8380a119cf8051162f8b3ea34375828992f42047dbe4e46",
  name: "getPortalData",
  filename: "src/server/functions/portal.ts"
}, (opts) => getPortalData.__executeServer(opts));
const getPortalData = createServerFn({
  method: "GET"
}).inputValidator((data) => {
  const token = data.token;
  if (!token || typeof token !== "string") {
    throw new Error("Invalid portal token");
  }
  return {
    token
  };
}).handler(getPortalData_createServerFn_handler, async ({
  data
}) => {
  const [borrower] = await db.select().from(borrowers).where(eq(borrowers.portalToken, data.token)).limit(1);
  if (!borrower) {
    throw new Error("Invalid portal link");
  }
  if (borrower.portalTokenExpiry && new Date(borrower.portalTokenExpiry) < /* @__PURE__ */ new Date()) {
    throw new Error("Portal link has expired");
  }
  const borrowerLoans = await db.select().from(loans).where(eq(loans.borrowerId, borrower.id)).orderBy(loans.dateGiven);
  const loanIds = borrowerLoans.map((l) => l.id);
  let allPayments = [];
  if (loanIds.length > 0) {
    for (const loanId of loanIds) {
      const loanPayments = await db.select({
        id: payments.id,
        loanId: payments.loanId,
        installmentNumber: payments.installmentNumber,
        dueDate: payments.dueDate,
        amountDue: payments.amountDue,
        amountPaid: payments.amountPaid,
        paidDate: payments.paidDate,
        status: payments.status
      }).from(payments).where(eq(payments.loanId, loanId)).orderBy(payments.installmentNumber);
      allPayments = allPayments.concat(loanPayments);
    }
  }
  const loansWithPayments = borrowerLoans.map((loan) => {
    const loanPayments = allPayments.filter((p) => p.loanId === loan.id);
    const paidCount = loanPayments.filter((p) => p.status === "paid").length;
    const totalRemaining = loanPayments.filter((p) => p.status !== "paid" && p.status !== "waived").reduce((sum, p) => sum + parseFloat(p.amountDue) - parseFloat(p.amountPaid), 0);
    const nextDue = loanPayments.find((p) => p.status === "pending" || p.status === "partial" || p.status === "overdue");
    return {
      id: loan.id,
      primaryAmount: loan.primaryAmount,
      totalRepayment: loan.totalRepayment,
      installmentAmount: loan.installmentAmount,
      totalInstallments: loan.totalInstallments,
      paymentFrequency: loan.paymentFrequency,
      status: loan.status,
      dateGiven: loan.dateGiven,
      paidCount,
      totalRemaining,
      nextDue: nextDue ? {
        dueDate: nextDue.dueDate,
        amountDue: nextDue.amountDue
      } : null,
      payments: loanPayments
    };
  });
  return {
    borrower: {
      name: borrower.name,
      mobile: borrower.mobile
    },
    loans: loansWithPayments
  };
});
export {
  getPortalData_createServerFn_handler
};
