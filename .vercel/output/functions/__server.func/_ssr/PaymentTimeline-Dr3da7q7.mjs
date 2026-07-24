import { j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { c as clsx } from "../_libs/clsx.mjs";
import { C as CurrencyDisplay } from "./CurrencyDisplay-PB3v2V9D.mjs";
import { D as DateDisplay } from "./DateDisplay-XPhW4pFb.mjs";
import { B as Badge } from "./Badge-BExCBNfX.mjs";
import { u as useTranslation } from "../_libs/react-i18next.mjs";
function daysSince(dateStr) {
  const due = /* @__PURE__ */ new Date(dateStr + "T00:00:00");
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - due.getTime()) / 864e5);
}
const methodLabel = {
  cash: "Cash",
  upi: "UPI",
  bank_transfer: "Bank Transfer",
  other: "Other"
};
function PaymentTimeline({ payments, onPaymentTap }) {
  const { t } = useTranslation();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-0", children: payments.map((payment, index) => {
    const isLast = index === payments.length - 1;
    const overdueDays = payment.status === "overdue" ? daysSince(payment.dueDate) : 0;
    const remaining = parseFloat(payment.amountDue) - parseFloat(payment.amountPaid);
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: clsx(
              "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
              payment.status === "paid" && "bg-emerald-100 text-emerald-700",
              payment.status === "overdue" && "bg-red-100 text-red-700",
              payment.status === "partial" && "bg-amber-100 text-amber-700",
              payment.status === "waived" && "bg-purple-100 text-purple-700",
              payment.status === "pending" && "bg-slate-100 text-slate-400"
            ),
            children: [
              payment.status === "paid" && "✓",
              payment.status === "pending" && "○",
              payment.status === "overdue" && "●",
              payment.status === "partial" && "◑",
              payment.status === "waived" && "—"
            ]
          }
        ),
        !isLast && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: clsx(
              "w-0.5 flex-1 min-h-[16px]",
              payment.status === "paid" || payment.status === "waived" ? "bg-emerald-200" : "bg-slate-200"
            )
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: () => onPaymentTap?.(payment),
          className: clsx(
            "flex-1 rounded-lg border p-3 mb-2 text-left transition-colors active:opacity-75",
            "border-slate-200 hover:border-primary hover:bg-primary/5 cursor-pointer",
            payment.status === "overdue" && "border-red-200 bg-red-50/60",
            payment.status === "partial" && "border-amber-200 bg-amber-50/40",
            payment.status === "paid" && "border-emerald-100",
            payment.status === "waived" && "border-purple-100 bg-purple-50/40"
          ),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold text-slate-700", children: t("payments.installmentNo", { number: payment.installmentNumber }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { status: payment.status, children: t(`payments.${payment.status}`) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mt-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(DateDisplay, { date: payment.dueDate, className: "text-xs text-slate-500" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                CurrencyDisplay,
                {
                  amount: parseFloat(payment.amountDue),
                  className: "text-sm font-semibold text-slate-900"
                }
              )
            ] }),
            payment.status === "paid" && payment.paidDate && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1.5 flex items-center gap-2 text-xs text-emerald-700", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "✓ Paid on" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(DateDisplay, { date: payment.paidDate }),
              payment.paymentMethod && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full", children: methodLabel[payment.paymentMethod] ?? payment.paymentMethod })
            ] }),
            payment.status === "partial" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1.5 space-y-0.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-xs", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-amber-700", children: "Paid so far" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: parseFloat(payment.amountPaid), className: "text-amber-700 font-medium" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-xs", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-500", children: "Still due" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: remaining, className: "text-slate-700 font-semibold" })
              ] })
            ] }),
            payment.status === "overdue" && overdueDays > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xs font-semibold text-red-600", children: t("loans.daysOverdue", { count: overdueDays }) }),
            payment.status === "waived" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xs text-purple-600", children: payment.notes ? `Reason: ${payment.notes}` : "Waived" })
          ]
        }
      )
    ] }, payment.id);
  }) });
}
export {
  PaymentTimeline as P
};
