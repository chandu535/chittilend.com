import { c as createServerRpc, l as loans, b as borrowers, d as db, p as payments, a as capitalPoolLog } from "./index-BN40sTes.mjs";
import { c as createLoanSchema } from "./loan-Dc_xM90c.mjs";
import { a as getAuthenticatedUser } from "./auth-BKEQ4cPm.mjs";
import { r as requireRole } from "./roleGuard-MoSFikSq.mjs";
import { c as calculateLoan, a as calculateStartMonth, g as generatePaymentSchedule } from "./calculations-DjV5_5Ok.mjs";
import { D as DEFAULTS } from "./constants-DFV23y0t.mjs";
import { c as createServerFn } from "./index.mjs";
import { e as eq, g as gte, l as lte, b as and, i as ilike, d as desc, c as count } from "../_libs/drizzle-orm.mjs";
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
const listLoans_createServerFn_handler = createServerRpc({
  id: "c6aac2c5f1e616252a1cd37b59ff41c6b3ed900ab92cbd85e8c5b69b6725aef3",
  name: "listLoans",
  filename: "src/server/functions/loans.ts"
}, (opts) => listLoans.__executeServer(opts));
const listLoans = createServerFn({
  method: "GET"
}).inputValidator((data) => {
  const d = data;
  return {
    page: d.page || 1,
    limit: d.limit || DEFAULTS.ITEMS_PER_PAGE,
    status: d.status || "",
    borrowerId: d.borrowerId || "",
    dateFrom: d.dateFrom || "",
    dateTo: d.dateTo || "",
    search: d.search || ""
  };
}).handler(listLoans_createServerFn_handler, async ({
  data
}) => {
  const user = await getAuthenticatedUser();
  requireRole(user, ["admin", "manager"]);
  const offset = (data.page - 1) * data.limit;
  const conditions = [];
  if (data.status && data.status !== "all") {
    conditions.push(eq(loans.status, data.status));
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
  const where = conditions.length > 0 ? and(...conditions) : void 0;
  if (data.search) {
    const pattern = `%${data.search}%`;
    const searchCondition = ilike(borrowers.name, pattern);
    const fullWhere = where ? and(where, searchCondition) : searchCondition;
    const [items2, totalResult2] = await Promise.all([db.select({
      loan: loans,
      borrowerName: borrowers.name,
      borrowerMobile: borrowers.mobile,
      borrowerArea: borrowers.area
    }).from(loans).innerJoin(borrowers, eq(loans.borrowerId, borrowers.id)).where(fullWhere).orderBy(desc(loans.createdAt)).limit(data.limit).offset(offset), db.select({
      count: count()
    }).from(loans).innerJoin(borrowers, eq(loans.borrowerId, borrowers.id)).where(fullWhere)]);
    return {
      items: items2.map((r) => ({
        ...r.loan,
        borrowerName: r.borrowerName,
        borrowerMobile: r.borrowerMobile,
        borrowerArea: r.borrowerArea
      })),
      total: totalResult2[0].count,
      page: data.page,
      limit: data.limit,
      totalPages: Math.ceil(totalResult2[0].count / data.limit)
    };
  }
  const [items, totalResult] = await Promise.all([db.select({
    loan: loans,
    borrowerName: borrowers.name,
    borrowerMobile: borrowers.mobile,
    borrowerArea: borrowers.area
  }).from(loans).innerJoin(borrowers, eq(loans.borrowerId, borrowers.id)).where(where).orderBy(desc(loans.createdAt)).limit(data.limit).offset(offset), db.select({
    count: count()
  }).from(loans).where(where)]);
  return {
    items: items.map((r) => ({
      ...r.loan,
      borrowerName: r.borrowerName,
      borrowerMobile: r.borrowerMobile,
      borrowerArea: r.borrowerArea
    })),
    total: totalResult[0].count,
    page: data.page,
    limit: data.limit,
    totalPages: Math.ceil(totalResult[0].count / data.limit)
  };
});
const getLoanById_createServerFn_handler = createServerRpc({
  id: "598abfe0b55db0d95b1f41e6294dee2fb9697115d41bec08c40a6a51475a1790",
  name: "getLoanById",
  filename: "src/server/functions/loans.ts"
}, (opts) => getLoanById.__executeServer(opts));
const getLoanById = createServerFn({
  method: "GET"
}).inputValidator((data) => {
  const id = data.id;
  if (!id) throw new Error("Loan ID is required");
  return {
    id
  };
}).handler(getLoanById_createServerFn_handler, async ({
  data
}) => {
  const user = await getAuthenticatedUser();
  requireRole(user, ["admin", "manager"]);
  const loan = await db.query.loans.findFirst({
    where: eq(loans.id, data.id),
    with: {
      borrower: {
        columns: {
          id: true,
          name: true,
          mobile: true,
          area: true,
          profilePhotoUrl: true
        }
      },
      payments: {
        orderBy: (payments2, {
          asc
        }) => [asc(payments2.installmentNumber)]
      }
    }
  });
  if (!loan) throw new Error("Loan not found");
  return loan;
});
const createLoan_createServerFn_handler = createServerRpc({
  id: "dc465117bc796bf617a74a59b0b3cf5a9a299261996da1e1500aafb78575d145",
  name: "createLoan",
  filename: "src/server/functions/loans.ts"
}, (opts) => createLoan.__executeServer(opts));
const createLoan = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const {
    error,
    value
  } = createLoanSchema.validate(data, {
    abortEarly: false
  });
  if (error) {
    const messages = error.details.map((d) => d.message).join(", ");
    throw new Error(messages);
  }
  return value;
}).handler(createLoan_createServerFn_handler, async ({
  data
}) => {
  const user = await getAuthenticatedUser();
  requireRole(user, ["admin", "manager"]);
  const calc = calculateLoan(data.primaryAmount, data.tenureMonths, data.paymentFrequency, data.serviceChargePercent, data.markupPercent);
  const dateGiven = new Date(data.dateGiven);
  const startMonth = calculateStartMonth(dateGiven);
  const [loan] = await db.insert(loans).values({
    borrowerId: data.borrowerId,
    dateGiven: data.dateGiven instanceof Date ? data.dateGiven.toISOString().split("T")[0] : data.dateGiven,
    startMonth: startMonth.toISOString().split("T")[0],
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
    status: "active",
    notes: data.notes || null,
    createdBy: user.id
  }).returning();
  const schedule = generatePaymentSchedule(startMonth, calc.totalRepayment, calc.totalInstallments, calc.paymentFrequency);
  for (const scheduled of schedule) {
    await db.insert(payments).values({
      loanId: loan.id,
      installmentNumber: scheduled.installmentNumber,
      dueDate: scheduled.dueDate.toISOString().split("T")[0],
      amountDue: scheduled.amountDue.toFixed(2),
      amountPaid: "0.00",
      status: "pending"
    });
  }
  const lastEntry = await db.select({
    runningBalance: capitalPoolLog.runningBalance
  }).from(capitalPoolLog).orderBy(desc(capitalPoolLog.createdAt)).limit(1);
  const currentBalance = lastEntry.length > 0 ? parseFloat(lastEntry[0].runningBalance) : 0;
  await db.insert(capitalPoolLog).values({
    eventType: "disbursement",
    amount: calc.primaryAmount.toFixed(2),
    runningBalance: (currentBalance - calc.primaryAmount).toFixed(2),
    referenceLoanId: loan.id,
    recordedBy: user.id
  });
  return loan;
});
const updateLoan_createServerFn_handler = createServerRpc({
  id: "deaca83f8752c79c3c1dda0649870988e1cf3c42f1baffc248e4cdec82929de1",
  name: "updateLoan",
  filename: "src/server/functions/loans.ts"
}, (opts) => updateLoan.__executeServer(opts));
const updateLoan = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const d = data;
  if (!d.id) throw new Error("Loan ID is required");
  if (d.status && !["active", "completed", "defaulted", "extended"].includes(d.status)) {
    throw new Error("Invalid status");
  }
  return d;
}).handler(updateLoan_createServerFn_handler, async ({
  data
}) => {
  const user = await getAuthenticatedUser();
  requireRole(user, ["admin", "manager"]);
  const updateData = {
    updatedAt: /* @__PURE__ */ new Date()
  };
  if (data.notes !== void 0) updateData.notes = data.notes;
  if (data.status) updateData.status = data.status;
  const [updated] = await db.update(loans).set(updateData).where(eq(loans.id, data.id)).returning();
  if (!updated) throw new Error("Loan not found");
  return updated;
});
const extendTenure_createServerFn_handler = createServerRpc({
  id: "30b913d22c4bf7659f9f140cd86dc966712ef404a269811cd4222e03d847627f",
  name: "extendTenure",
  filename: "src/server/functions/loans.ts"
}, (opts) => extendTenure.__executeServer(opts));
const extendTenure = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const d = data;
  if (!d.id) throw new Error("Loan ID is required");
  if (!d.newTenureMonths || d.newTenureMonths < 1) {
    throw new Error("New tenure must be at least 1 month");
  }
  return d;
}).handler(extendTenure_createServerFn_handler, async ({
  data
}) => {
  const user = await getAuthenticatedUser();
  requireRole(user, ["admin", "manager"]);
  const loan = await db.query.loans.findFirst({
    where: eq(loans.id, data.id),
    with: {
      payments: true
    }
  });
  if (!loan) throw new Error("Loan not found");
  const oldTotalInstallments = loan.totalInstallments;
  const totalRepayment = parseFloat(loan.totalRepayment);
  const newTotalInstallments = loan.paymentFrequency === "monthly" ? data.newTenureMonths : data.newTenureMonths * 4;
  if (newTotalInstallments <= oldTotalInstallments) {
    throw new Error("New tenure must be longer than current tenure");
  }
  const paidAmount = loan.payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + parseFloat(p.amountPaid), 0);
  const remainingAmount = totalRepayment - paidAmount;
  const paidInstallments = loan.payments.filter((p) => p.status === "paid").length;
  const newRemainingInstallments = newTotalInstallments - paidInstallments;
  const newInstallmentAmount = remainingAmount / newRemainingInstallments;
  const unpaidPayments = loan.payments.filter((p) => p.status !== "paid");
  for (const payment of unpaidPayments) {
    await db.update(payments).set({
      amountDue: newInstallmentAmount.toFixed(2)
    }).where(eq(payments.id, payment.id));
  }
  const lastPayment = loan.payments[loan.payments.length - 1];
  const lastDueDate = new Date(lastPayment.dueDate);
  for (let i = oldTotalInstallments + 1; i <= newTotalInstallments; i++) {
    const dueDate = new Date(lastDueDate);
    const offset = i - oldTotalInstallments;
    if (loan.paymentFrequency === "monthly") {
      dueDate.setMonth(dueDate.getMonth() + offset);
    } else {
      dueDate.setDate(dueDate.getDate() + offset * 7);
    }
    await db.insert(payments).values({
      loanId: loan.id,
      installmentNumber: i,
      dueDate: dueDate.toISOString().split("T")[0],
      amountDue: newInstallmentAmount.toFixed(2),
      amountPaid: "0.00",
      status: "pending"
    });
  }
  const [updated] = await db.update(loans).set({
    tenureMonths: data.newTenureMonths,
    totalInstallments: newTotalInstallments,
    installmentAmount: newInstallmentAmount.toFixed(2),
    status: "extended",
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(loans.id, data.id)).returning();
  return updated;
});
export {
  createLoan_createServerFn_handler,
  extendTenure_createServerFn_handler,
  getLoanById_createServerFn_handler,
  listLoans_createServerFn_handler,
  updateLoan_createServerFn_handler
};
