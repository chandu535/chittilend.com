import { r as reactExports, j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { P as PageSkeleton } from "./PageSkeleton-CL8u5l4B.mjs";
import { L as LanguageToggle } from "./LanguageToggle-Cd8Lyhvw.mjs";
import { B as Badge } from "./Badge-BExCBNfX.mjs";
import { C as CurrencyDisplay } from "./CurrencyDisplay-DxtEIDNl.mjs";
import { D as DateDisplay } from "./DateDisplay-B5D35cED.mjs";
import { c as clsx } from "../_libs/clsx.mjs";
import { c as Route$b, g as getPortalData } from "./router-BkdMoR6V.mjs";
import { u as useLocalizedName } from "./NameDisplay-BEn732AH.mjs";
import { u as useTranslation } from "../_libs/react-i18next.mjs";
import "../_chunks/_libs/@tanstack/react-store.mjs";
import "../_libs/use-sync-external-store.mjs";
import "./constants-CT9Kuti2.mjs";
import "./formatters-khdU1uWq.mjs";
import "../_chunks/_libs/@tanstack/router-core.mjs";
import "../_libs/cookie-es.mjs";
import "../_chunks/_libs/@tanstack/history.mjs";
import "../_libs/tiny-invariant.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_chunks/_libs/@tanstack/react-router.mjs";
import "../_chunks/_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/tiny-warning.mjs";
import "../_chunks/_libs/@tanstack/store.mjs";
import "../_libs/i18next.mjs";
import "./index.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "./auth-CwIywibs.mjs";
import "../_libs/joi.mjs";
import "../_chunks/_libs/@hapi/hoek.mjs";
import "../_chunks/_libs/@hapi/formula.mjs";
import "../_chunks/_libs/@hapi/pinpoint.mjs";
import "../_chunks/_libs/@hapi/topo.mjs";
import "../_chunks/_libs/@hapi/address.mjs";
import "url";
import "../_chunks/_libs/@hapi/tlds.mjs";
function PortalHeader() {
  const { t } = useTranslation();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-lg mx-auto flex items-center justify-between", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-lg font-bold text-primary", children: t("common.appName") }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(LanguageToggle, {})
  ] }) });
}
function PortalLoanCard({
  primaryAmount,
  totalRepayment,
  installmentAmount,
  totalInstallments,
  paidCount,
  totalRemaining,
  paymentFrequency,
  status,
  nextDue
}) {
  const { t } = useTranslation();
  const progress = totalInstallments > 0 ? paidCount / totalInstallments * 100 : 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: t("loans.primaryAmount") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: parseFloat(primaryAmount), className: "text-lg font-bold text-slate-900" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { status, children: t(`loans.status${status.charAt(0).toUpperCase() + status.slice(1)}`) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2 text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-500", children: t("loans.totalRepayment") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: parseFloat(totalRepayment), className: "font-semibold text-slate-900" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-500", children: t("loans.installment") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: parseFloat(installmentAmount), className: "font-semibold text-slate-900" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-slate-400 ml-1", children: paymentFrequency === "monthly" ? t("loans.perMonth") : t("loans.perWeek") })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-xs text-slate-500 mb-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t("loans.progress", { paid: paidCount, total: totalInstallments }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          Math.round(progress),
          "%"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 rounded-full bg-slate-100 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "h-full rounded-full bg-primary transition-all",
          style: { width: `${progress}%` }
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2 text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-slate-50 p-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: t("portal.totalRemaining") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: totalRemaining, className: "font-bold text-slate-900" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-slate-50 p-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: t("portal.nextDue") }),
        nextDue ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: parseFloat(nextDue.amountDue), className: "font-bold text-slate-900" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DateDisplay, { date: nextDue.dueDate, className: "text-xs text-slate-400 block" })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-emerald-600", children: t("portal.noDue") })
      ] })
    ] })
  ] });
}
const statusIcons = {
  paid: "✓",
  pending: "○",
  overdue: "●",
  partial: "◑",
  waived: "—"
};
function PortalPaymentList({ payments }) {
  const { t } = useTranslation();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-0", children: payments.map((payment, index) => {
    const isLast = index === payments.length - 1;
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: clsx(
              "h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
              payment.status === "paid" && "bg-emerald-100 text-emerald-700",
              payment.status === "overdue" && "bg-red-100 text-red-700",
              payment.status === "partial" && "bg-amber-100 text-amber-700",
              payment.status === "waived" && "bg-purple-100 text-purple-700",
              payment.status === "pending" && "bg-slate-100 text-slate-400"
            ),
            children: statusIcons[payment.status]
          }
        ),
        !isLast && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: clsx(
              "w-0.5 flex-1 min-h-[12px]",
              payment.status === "paid" ? "bg-emerald-200" : "bg-slate-200"
            )
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 rounded-lg border border-slate-100 p-2.5 mb-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium text-slate-600", children: t("payments.installmentNo", { number: payment.installmentNumber }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { status: payment.status, children: t(`payments.${payment.status}`) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mt-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DateDisplay, { date: payment.dueDate, className: "text-xs text-slate-400" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            CurrencyDisplay,
            {
              amount: parseFloat(payment.amountDue),
              className: "text-sm font-semibold text-slate-900"
            }
          )
        ] }),
        payment.status === "paid" && payment.paidDate && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-0.5 text-xs text-emerald-600", children: [
          t("payments.paidDate"),
          ": ",
          /* @__PURE__ */ jsxRuntimeExports.jsx(DateDisplay, { date: payment.paidDate })
        ] })
      ] })
    ] }, payment.id);
  }) });
}
function PortalPage() {
  const {
    token
  } = Route$b.useParams();
  const {
    t
  } = useTranslation();
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState(null);
  const [data, setData] = reactExports.useState(null);
  const borrowerName = useLocalizedName(data?.borrower?.name || "");
  reactExports.useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const result = await getPortalData({
          data: {
            token
          }
        });
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("errors.invalidToken"));
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [token, t]);
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-slate-50", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(PortalHeader, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-w-lg mx-auto px-4 py-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PageSkeleton, { variant: "portal" }) })
    ] });
  }
  if (error || !data) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-slate-50", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(PortalHeader, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-lg mx-auto px-4 py-12 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-4xl mb-4", children: "!" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-semibold text-slate-700", children: error || t("errors.invalidToken") })
      ] })
    ] });
  }
  const allCompleted = data.loans.every((l) => l.status === "completed");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-slate-50", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(PortalHeader, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-lg mx-auto px-4 py-6 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-semibold text-slate-900", children: t("portal.welcome", {
        name: borrowerName
      }) }) }),
      allCompleted && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-emerald-700 font-medium", children: t("portal.allPaid") }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-slate-500 uppercase tracking-wide", children: t("portal.yourLoans") }),
      data.loans.map((loan) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(PortalLoanCard, { primaryAmount: loan.primaryAmount, totalRepayment: loan.totalRepayment, installmentAmount: loan.installmentAmount, totalInstallments: loan.totalInstallments, paidCount: loan.paidCount, totalRemaining: loan.totalRemaining, paymentFrequency: loan.paymentFrequency, status: loan.status, nextDue: loan.nextDue }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-semibold text-slate-500 uppercase mb-2", children: t("portal.paymentSchedule") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(PortalPaymentList, { payments: loan.payments })
        ] })
      ] }, loan.id))
    ] })
  ] });
}
export {
  PortalPage as component
};
