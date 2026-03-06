import { r as reactExports, j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { L as Link } from "../_chunks/_libs/@tanstack/react-router.mjs";
import { g as getLoanById } from "./loans-EIa1sntp.mjs";
import { C as Card, a as CardTitle } from "./Card-CBpRnpD5.mjs";
import { B as Badge } from "./Badge-_eeoowG6.mjs";
import { S as Spinner } from "./Spinner-7dxOTM9g.mjs";
import { C as CurrencyDisplay } from "./CurrencyDisplay-Ca9SH7ZJ.mjs";
import { D as DateDisplay } from "./DateDisplay-j1uvyMji.mjs";
import { u as useLocalizedName } from "./NameDisplay-B-OL-WuP.mjs";
import { c as clsx } from "../_libs/clsx.mjs";
import { P as PaymentMarkModal } from "./PaymentMarkModal-6AKkj0zG.mjs";
import { d as formatPhone } from "./formatters-khdU1uWq.mjs";
import { o as Route$2 } from "./router-De5441r5.mjs";
import { u as useTranslation } from "../_libs/react-i18next.mjs";
import "../_chunks/_libs/@tanstack/router-core.mjs";
import "../_libs/cookie-es.mjs";
import "../_chunks/_libs/@tanstack/history.mjs";
import "../_libs/tiny-invariant.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_chunks/_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/tiny-warning.mjs";
import "./loan-Dc_xM90c.mjs";
import "../_libs/joi.mjs";
import "../_chunks/_libs/@hapi/hoek.mjs";
import "../_chunks/_libs/@hapi/formula.mjs";
import "../_chunks/_libs/@hapi/pinpoint.mjs";
import "../_chunks/_libs/@hapi/topo.mjs";
import "../_chunks/_libs/@hapi/address.mjs";
import "url";
import "../_chunks/_libs/@hapi/tlds.mjs";
import "./constants-DFV23y0t.mjs";
import "./index.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "../_chunks/_libs/@tanstack/react-store.mjs";
import "../_libs/use-sync-external-store.mjs";
import "./Input-CQaLwuWI.mjs";
import "./Select-tn0N3Klx.mjs";
import "./DatePicker-Doyp9g9q.mjs";
import "./payments-DIBCZgRG.mjs";
import "./payment-jMyh0Ybg.mjs";
import "../_chunks/_libs/@tanstack/store.mjs";
import "../_libs/i18next.mjs";
import "./auth-CwIywibs.mjs";
const statusIcons = {
  paid: "✓",
  pending: "○",
  overdue: "●",
  partial: "◑",
  waived: "—"
};
function PaymentTimeline({ payments, onPaymentTap }) {
  const { t } = useTranslation();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-0", children: payments.map((payment, index) => {
    const isLast = index === payments.length - 1;
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
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
            children: statusIcons[payment.status]
          }
        ),
        !isLast && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: clsx(
          "w-0.5 flex-1 min-h-[16px]",
          payment.status === "paid" ? "bg-emerald-200" : "bg-slate-200"
        ) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          disabled: false,
          onClick: () => onPaymentTap?.(payment),
          className: clsx(
            "flex-1 rounded-lg border p-3 mb-2 text-left transition-colors",
            "border-slate-200 hover:border-primary hover:bg-primary/5 cursor-pointer",
            payment.status === "overdue" && "border-red-200 bg-red-50/50"
          ),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-slate-700", children: t("payments.installmentNo", { number: payment.installmentNumber }) }),
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
            payment.status === "paid" && payment.paidDate && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-xs text-emerald-600", children: [
              t("payments.paidDate"),
              ": ",
              /* @__PURE__ */ jsxRuntimeExports.jsx(DateDisplay, { date: payment.paidDate })
            ] }),
            payment.status === "partial" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-xs text-amber-600", children: [
              t("payments.amountPaid"),
              ": ",
              /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: parseFloat(payment.amountPaid) })
            ] })
          ]
        }
      )
    ] }, payment.id);
  }) });
}
function LoanDetailPage() {
  const {
    loanId
  } = Route$2.useParams();
  const {
    t
  } = useTranslation();
  const [loan, setLoan] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [selectedPayment, setSelectedPayment] = reactExports.useState(null);
  const borrowerDisplayName = useLocalizedName(loan?.borrower?.name ?? "");
  const fetchLoan = reactExports.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLoanById({
        data: {
          id: loanId
        }
      });
      setLoan(data);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [loanId]);
  reactExports.useEffect(() => {
    fetchLoan();
  }, [fetchLoan]);
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Spinner, { size: "lg" }) });
  }
  if (!loan) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center text-slate-500 py-12", children: t("errors.notFound") });
  }
  const paidCount = loan.payments.filter((p) => p.status === "paid").length;
  const progress = loan.totalInstallments > 0 ? paidCount / loan.totalInstallments * 100 : 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mx-auto space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/loans", className: "text-slate-400 hover:text-slate-600", children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M15 19l-7-7 7-7" }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-slate-900", children: t("loans.loanDetails") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/borrowers/$borrowerId", params: {
      borrowerId: loan.borrower.id
    }, className: "flex items-center gap-3 hover:opacity-80 transition-opacity", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0", children: borrowerDisplayName.charAt(0).toUpperCase() }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-slate-900", children: borrowerDisplayName }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-500", children: formatPhone(loan.borrower.mobile) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: t("loans.loanDetails") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { status: loan.status, children: t(`loans.status${loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}`) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-500", children: t("loans.primaryAmount") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: parseFloat(loan.primaryAmount), className: "font-semibold text-slate-900" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-500", children: t("loans.amountReceived") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: parseFloat(loan.amountUserReceived), className: "font-semibold text-slate-900" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-500", children: t("loans.totalRepayment") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: parseFloat(loan.totalRepayment), className: "font-bold text-slate-900" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-500", children: t("loans.installment") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: parseFloat(loan.installmentAmount), className: "font-semibold text-slate-900" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-slate-400 ml-1", children: loan.paymentFrequency === "monthly" ? t("loans.perMonth") : t("loans.perWeek") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-500", children: t("loans.dateGiven") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DateDisplay, { date: loan.dateGiven, className: "font-medium text-slate-900" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-500", children: t("loans.profit") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: parseFloat(loan.profitAmount), className: "font-semibold text-emerald-600" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-xs text-slate-500 mb-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t("loans.progress", {
            paid: paidCount,
            total: loan.totalInstallments
          }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            Math.round(progress),
            "%"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 rounded-full bg-slate-100 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full rounded-full bg-primary transition-all", style: {
          width: `${progress}%`
        } }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: t("payments.title") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentTimeline, { payments: loan.payments, onPaymentTap: (payment) => setSelectedPayment(payment) }) })
    ] }),
    selectedPayment && /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentMarkModal, { payment: selectedPayment, onClose: () => setSelectedPayment(null), onSuccess: () => {
      setSelectedPayment(null);
      fetchLoan();
    } })
  ] });
}
export {
  LoanDetailPage as component
};
