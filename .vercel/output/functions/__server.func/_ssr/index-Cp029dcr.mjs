import { r as reactExports, j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { L as Link } from "../_chunks/_libs/@tanstack/react-router.mjs";
import { l as listLoans, g as getLoanById } from "./loans-DdW0j3QS.mjs";
import { B as Button } from "./router-BkdMoR6V.mjs";
import { I as Input } from "./Input-DxOP6u0W.mjs";
import { S as Select } from "./Select-tn0N3Klx.mjs";
import { B as Badge } from "./Badge-BExCBNfX.mjs";
import { c as clsx } from "../_libs/clsx.mjs";
import { P as PageSkeleton, I as InlineSkeleton } from "./PageSkeleton-CL8u5l4B.mjs";
import { C as CurrencyDisplay } from "./CurrencyDisplay-DxtEIDNl.mjs";
import { D as DateDisplay } from "./DateDisplay-B5D35cED.mjs";
import { N as NameDisplay, u as useLocalizedName } from "./NameDisplay-BEn732AH.mjs";
import { B as BorrowerAvatar } from "./BorrowerAvatar-C75IJ0wD.mjs";
import { P as PaymentTimeline } from "./PaymentTimeline-BxUyWgI1.mjs";
import { P as PaymentMarkModal } from "./PaymentMarkModal-BEwoHZ6F.mjs";
import { E as EmptyState } from "./EmptyState-CP7HaiDi.mjs";
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
import "./constants-CT9Kuti2.mjs";
import "./index.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "../_chunks/_libs/@tanstack/store.mjs";
import "../_chunks/_libs/@tanstack/react-store.mjs";
import "../_libs/use-sync-external-store.mjs";
import "../_libs/i18next.mjs";
import "./auth-CwIywibs.mjs";
import "./formatters-khdU1uWq.mjs";
import "./DatePicker-Doyp9g9q.mjs";
import "./payments-za2vx1po.mjs";
import "./payment-jMyh0Ybg.mjs";
function isOverdueDate(dueDate) {
  const due = /* @__PURE__ */ new Date(dueDate + "T00:00:00");
  const today = /* @__PURE__ */ new Date();
  const endOfCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return due <= endOfCurrentMonth;
}
function overdueDays(dueDate) {
  const due = /* @__PURE__ */ new Date(dueDate + "T00:00:00");
  const today = /* @__PURE__ */ new Date();
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  today.setHours(0, 0, 0, 0);
  const overdueFrom = due < currentMonthStart ? due : currentMonthStart;
  return Math.max(0, Math.floor((today.getTime() - overdueFrom.getTime()) / 864e5));
}
function getChipLabel(nextPayment, chipRemaining) {
  if (nextPayment.status === "overdue" || isOverdueDate(nextPayment.dueDate)) {
    return `${overdueDays(nextPayment.dueDate)}d overdue`;
  }
  if (chipRemaining !== null && chipRemaining > 0) {
    return `₹${Math.round(chipRemaining).toLocaleString("en-IN")}`;
  }
  const due = /* @__PURE__ */ new Date(nextPayment.dueDate + "T00:00:00");
  return due.toLocaleDateString("en-IN", { month: "short" });
}
const STATUS_STRIP = {
  active: "from-violet-500 to-violet-400",
  completed: "from-emerald-500 to-teal-400",
  defaulted: "from-red-500 to-rose-400",
  extended: "from-amber-500 to-yellow-400"
};
const STATUS_LABEL = {
  active: { bg: "bg-violet-50", text: "text-violet-700", label: "Active" },
  completed: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Completed" },
  defaulted: { bg: "bg-red-50", text: "text-red-600", label: "Defaulted" },
  extended: { bg: "bg-amber-50", text: "text-amber-700", label: "Extended" }
};
function LoanCard({
  id,
  loanNumber,
  borrowerName,
  borrowerPhotoUrl,
  nextPayment: nextPaymentProp,
  primaryAmount,
  totalRepayment,
  paidAmount: paidAmountProp,
  status,
  totalInstallments,
  paidInstallments,
  dateGiven
}) {
  const { t } = useTranslation();
  const displayName = useLocalizedName(borrowerName);
  const [open, setOpen] = reactExports.useState(false);
  const [details, setDetails] = reactExports.useState(null);
  const [fetching, setFetching] = reactExports.useState(false);
  const [selectedPayment, setSelectedPayment] = reactExports.useState(null);
  const [nextPayment, setNextPayment] = reactExports.useState(nextPaymentProp ?? null);
  reactExports.useEffect(() => {
    setNextPayment(nextPaymentProp ?? null);
  }, [nextPaymentProp]);
  reactExports.useEffect(() => {
    if (!details) return;
    const next = details.payments.find((p) => p.status !== "paid" && p.status !== "waived");
    setNextPayment(
      next ? {
        id: next.id,
        installmentNumber: next.installmentNumber,
        dueDate: next.dueDate,
        amountDue: next.amountDue,
        amountPaid: next.amountPaid,
        status: next.status
      } : null
    );
  }, [details]);
  const paidCount = details?.payments.filter((p) => p.status === "paid").length ?? paidInstallments;
  const pendingCount = details?.payments.filter((p) => p.status === "pending" || p.status === "partial").length ?? 0;
  const overdueCount = details?.payments.filter((p) => p.status === "overdue").length ?? 0;
  const paidAmount = details ? details.payments.reduce((sum, payment) => sum + parseFloat(payment.amountPaid), 0) : parseFloat(paidAmountProp);
  const repaymentAmount = details ? parseFloat(details.totalRepayment) : parseFloat(totalRepayment);
  const progress = repaymentAmount > 0 ? paidAmount / repaymentAmount * 100 : 0;
  const loadDetails = reactExports.useCallback(async () => {
    setFetching(true);
    try {
      const data = await getLoanById({ data: { id } });
      setDetails(data);
    } catch {
    } finally {
      setFetching(false);
    }
  }, [id]);
  const handleToggle = reactExports.useCallback(async () => {
    if (!open && !details) await loadDetails();
    setOpen((o) => !o);
  }, [open, details, loadDetails]);
  const handleQuickMark = reactExports.useCallback((e) => {
    e.stopPropagation();
    if (!nextPayment) return;
    setSelectedPayment({
      id: nextPayment.id,
      installmentNumber: nextPayment.installmentNumber,
      dueDate: nextPayment.dueDate,
      amountDue: nextPayment.amountDue,
      amountPaid: nextPayment.amountPaid,
      paidDate: null,
      status: nextPayment.status,
      loanId: id,
      createdAt: "",
      updatedAt: "",
      paymentMethod: null,
      notes: null,
      recordedBy: null
    });
  }, [nextPayment, id]);
  const chipOverdue = nextPayment && (nextPayment.status === "overdue" || isOverdueDate(nextPayment.dueDate));
  const chipPartial = nextPayment?.status === "partial";
  const currentMonthStart = /* @__PURE__ */ new Date();
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0, 0, 0, 0);
  const hasPreviousMonthBalance = Boolean(
    nextPayment && /* @__PURE__ */ new Date(nextPayment.dueDate + "T00:00:00") < currentMonthStart
  );
  const chipRemainingCalc = chipPartial && nextPayment ? parseFloat(nextPayment.amountDue) - parseFloat(nextPayment.amountPaid) : null;
  const chipRemaining = chipRemainingCalc && chipRemainingCalc > 0 ? chipRemainingCalc : null;
  const paidForCurrentMonth = Boolean(
    nextPayment && !chipOverdue && /* @__PURE__ */ new Date(nextPayment.dueDate + "T00:00:00") > new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() + 1, 0)
  );
  const pill = STATUS_LABEL[status];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: clsx(
          "bg-white rounded-3xl overflow-hidden border transition-all duration-300",
          status === "completed" ? "border-emerald-300" : "border-slate-200",
          open ? "shadow-[0_8px_32px_rgba(109,40,217,0.15)]" : "shadow-[0_2px_16px_rgba(109,40,217,0.08)] hover:shadow-[0_4px_24px_rgba(109,40,217,0.13)]"
        ),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: clsx("h-[3px] bg-gradient-to-r", STATUS_STRIP[status]) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: handleToggle, className: "w-full text-left", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3.5 px-4 pt-4 pb-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(BorrowerAvatar, { name: borrowerName, photoUrl: borrowerPhotoUrl, size: "lg" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-base font-bold text-slate-500 tabular-nums mb-0.5", children: [
                  "#",
                  loanNumber
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-slate-800 text-[15px] leading-snug truncate", children: displayName }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  CurrencyDisplay,
                  {
                    amount: parseFloat(primaryAmount),
                    className: "text-[22px] font-bold text-slate-900 leading-tight"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-end gap-2 shrink-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: clsx("px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide", pill.bg, pill.text), children: pill.label }),
                status === "completed" ? null : paidForCurrentMonth ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 flex items-center justify-center rounded-2xl border border-slate-200 bg-white", children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-4 w-4 text-emerald-500", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 13l4 4L19 7" }) }) }) : nextPayment ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: handleQuickMark,
                    className: clsx(
                      "flex flex-col items-center rounded-2xl px-2.5 py-1.5 min-w-[50px]",
                      "font-semibold text-[11px] leading-none",
                      "transition-transform duration-150 active:scale-95",
                      chipPartial && !hasPreviousMonthBalance ? "border border-red-200 bg-red-100 text-red-700" : chipOverdue ? "bg-gradient-to-b from-red-500 to-red-600 text-white shadow-[0_2px_8px_rgba(239,68,68,0.4)]" : "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-[0_2px_8px_rgba(16,185,129,0.35)]"
                    ),
                    "aria-label": `Mark installment ${nextPayment.installmentNumber} paid`,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-center leading-tight", children: getChipLabel(nextPayment, chipRemaining) }),
                      !chipOverdue && /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-3 w-3 mt-1", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 13l4 4L19 7" }) })
                    ]
                  }
                ) : null,
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "svg",
                  {
                    className: clsx("h-4 w-4 text-slate-300 transition-transform duration-200", open && "rotate-180"),
                    fill: "none",
                    viewBox: "0 0 24 24",
                    stroke: "currentColor",
                    strokeWidth: 2,
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 9l-7 7-7-7" })
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 pb-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-[11px] mb-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-slate-400 font-medium", children: [
                  paidCount,
                  " of ",
                  totalInstallments,
                  " payments"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-semibold text-slate-500", children: [
                  Math.round(progress),
                  "%"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1.5 rounded-full bg-slate-100 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: clsx(
                    "h-full rounded-full transition-all duration-500",
                    status === "completed" ? "bg-gradient-to-r from-emerald-500 to-teal-400" : status === "defaulted" ? "bg-gradient-to-r from-red-400 to-rose-400" : "bg-gradient-to-r from-violet-500 to-violet-400"
                  ),
                  style: { width: `${progress}%` }
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-[11px] mt-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(DateDisplay, { date: dateGiven, className: "text-slate-400" }),
                chipOverdue && nextPayment && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-red-500 font-semibold", children: [
                  overdueDays(nextPayment.dueDate),
                  "d overdue"
                ] })
              ] })
            ] })
          ] }),
          open && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-slate-50", children: fetching ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 py-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(InlineSkeleton, { className: "h-24 w-full" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(InlineSkeleton, { className: "h-20 w-full" })
          ] }) : details ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 pb-5 pt-4 space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(MiniStat, { label: t("loans.amountGiven"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: parseFloat(details.amountUserReceived), className: "font-semibold text-slate-800 text-[13px]" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(MiniStat, { label: t("loans.totalRepayment"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: parseFloat(details.totalRepayment), className: "font-semibold text-slate-800 text-[13px]" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(MiniStat, { label: t("loans.installment"), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: parseFloat(details.installmentAmount), className: "font-semibold text-slate-800 text-[13px]" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] text-slate-400", children: [
                  "/",
                  details.paymentFrequency === "monthly" ? "mo" : "wk"
                ] })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(MiniStat, { label: t("loans.profit"), accent: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: parseFloat(details.profitAmount), className: "font-semibold text-emerald-600 text-[13px]" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(MiniStat, { label: t("loans.dateGiven"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(DateDisplay, { date: details.dateGiven, className: "font-medium text-slate-800 text-[13px]" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(MiniStat, { label: t("loans.tenure"), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium text-slate-800 text-[13px]", children: [
                details.tenureMonths,
                " ",
                t("loans.months")
              ] }) })
            ] }),
            details.payments.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 flex-wrap", children: [
              paidCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold", children: [
                paidCount,
                " paid"
              ] }),
              pendingCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[11px] font-semibold", children: [
                pendingCount,
                " pending"
              ] }),
              overdueCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "px-2.5 py-1 rounded-full bg-red-50 text-red-500 text-[11px] font-semibold", children: [
                overdueCount,
                " overdue"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Link,
                {
                  to: "/borrowers/$borrowerId",
                  params: { borrowerId: details.borrower.id },
                  className: "flex items-center gap-1.5 text-[12px] font-semibold text-violet-600",
                  onClick: (e) => e.stopPropagation(),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-3.5 w-3.5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" }) }),
                    t("borrowers.title")
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Link,
                {
                  to: "/loans/$loanId",
                  params: { loanId: id },
                  className: "flex items-center gap-1 text-[12px] font-semibold text-slate-400 hover:text-slate-600 transition-colors",
                  onClick: (e) => e.stopPropagation(),
                  children: [
                    t("loans.loanDetails"),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-3.5 w-3.5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 5l7 7-7 7" }) })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3", children: t("payments.title") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                PaymentTimeline,
                {
                  payments: details.payments,
                  onPaymentTap: (p) => setSelectedPayment(p)
                }
              )
            ] })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: loadDetails, className: "text-sm text-violet-600 font-medium", children: "Retry" }) }) })
        ]
      }
    ),
    selectedPayment && /* @__PURE__ */ jsxRuntimeExports.jsx(
      PaymentMarkModal,
      {
        payment: selectedPayment,
        onClose: () => setSelectedPayment(null),
        onSuccess: async () => {
          setSelectedPayment(null);
          await loadDetails();
        }
      }
    )
  ] });
}
function MiniStat({
  label,
  children,
  accent = false
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: clsx(
    "rounded-2xl px-3 py-2.5",
    accent ? "bg-emerald-50" : "bg-[#F7F6FE]"
  ), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-medium text-slate-400 mb-0.5 uppercase tracking-wide", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children })
  ] });
}
function isToday(dateStr) {
  const today = /* @__PURE__ */ new Date();
  const d = /* @__PURE__ */ new Date(dateStr + "T00:00:00");
  return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
}
function loanDisplayPriority(loan) {
  if (loan.status === "completed") return 3;
  if (!loan.nextPayment) return 2;
  const today = /* @__PURE__ */ new Date();
  const endOfCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const dueDate = /* @__PURE__ */ new Date(loan.nextPayment.dueDate + "T00:00:00");
  if (dueDate <= endOfCurrentMonth) return 0;
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  if (/* @__PURE__ */ new Date(loan.dateGiven + "T00:00:00") < currentMonthStart) return 2;
  return 1;
}
function LoansPage() {
  const {
    t
  } = useTranslation();
  const [search, setSearch] = reactExports.useState("");
  const [status, setStatus] = reactExports.useState("all");
  const [page, setPage] = reactExports.useState(1);
  const [limit] = reactExports.useState(25);
  const [loading, setLoading] = reactExports.useState(true);
  const [result, setResult] = reactExports.useState({
    items: [],
    total: 0,
    totalPages: 0
  });
  const fetchLoans = async () => {
    setLoading(true);
    try {
      const data = await listLoans({
        data: {
          page,
          limit,
          status,
          search
        }
      });
      setResult(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };
  reactExports.useEffect(() => {
    fetchLoans();
  }, [page, status]);
  reactExports.useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchLoans();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  const activeCount = result.items.filter((l) => l.status === "active" || l.status === "extended").length;
  const overdueCount = result.items.filter((l) => l.nextPayment?.status === "overdue").length;
  const dueTodayCount = result.items.filter((l) => l.nextPayment && isToday(l.nextPayment.dueDate) && l.nextPayment.status !== "overdue").length;
  const statusOptions = [{
    value: "all",
    label: t("common.all")
  }, {
    value: "active",
    label: t("loans.statusActive")
  }, {
    value: "completed",
    label: t("loans.statusCompleted")
  }, {
    value: "defaulted",
    label: t("loans.statusDefaulted")
  }, {
    value: "extended",
    label: t("loans.statusExtended")
  }];
  const sortedLoans = [...result.items].sort((a, b) => {
    const priorityDifference = loanDisplayPriority(a) - loanDisplayPriority(b);
    return priorityDifference || a.loanNumber - b.loanNumber;
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-[22px] font-semibold text-slate-900 tracking-tight", children: t("loans.title") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/loans/new", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", children: t("loans.newLoan") }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: t("common.search"), value: search, onChange: (e) => setSearch(e.target.value), leftIcon: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }) }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Select, { value: status, onChange: (e) => {
        setStatus(e.target.value);
        setPage(1);
      }, options: statusOptions })
    ] }),
    !loading && result.items.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 overflow-x-auto pb-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SummaryPill, { label: `${activeCount} Active`, color: "blue", onClick: () => {
        setStatus("active");
        setPage(1);
      }, active: status === "active" }),
      overdueCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(SummaryPill, { label: `${overdueCount} Overdue`, color: "red" }),
      dueTodayCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(SummaryPill, { label: `${dueTodayCount} Due Today`, color: "amber" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SummaryPill, { label: `${result.total} Total`, color: "slate", onClick: () => {
        setStatus("all");
        setPage(1);
      }, active: status === "all" })
    ] }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(PageSkeleton, { variant: "table" }) : result.items.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { title: t("loans.noLoans"), action: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/loans/new", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { children: t("loans.newLoan") }) }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sm:hidden space-y-3", children: sortedLoans.map((loan) => /* @__PURE__ */ jsxRuntimeExports.jsx(LoanCard, { id: loan.id, loanNumber: loan.loanNumber, borrowerName: loan.borrowerName, borrowerPhotoUrl: loan.borrowerPhotoUrl, nextPayment: loan.nextPayment, primaryAmount: loan.primaryAmount, totalRepayment: loan.totalRepayment, paidAmount: loan.paidAmount, status: loan.status, totalInstallments: loan.totalInstallments, paidInstallments: loan.paidInstallments, dateGiven: loan.dateGiven }, loan.id)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden sm:block overflow-x-auto rounded-2xl border border-slate-100 bg-white", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-slate-100 text-left text-xs text-slate-500 uppercase tracking-wide", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 font-semibold w-12", children: "#" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 font-semibold", children: t("borrowers.name") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 font-semibold", children: t("loans.primaryAmount") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 font-semibold", children: t("common.status") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 font-semibold", children: "Progress" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 font-semibold", children: "Next Payment" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3 font-semibold", children: t("common.actions") })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-slate-50", children: sortedLoans.map((loan) => {
          const progress = parseFloat(loan.totalRepayment) > 0 ? Math.round(parseFloat(loan.paidAmount) / parseFloat(loan.totalRepayment) * 100) : 0;
          const nextOverdue = loan.nextPayment?.status === "overdue";
          const nextPartial = loan.nextPayment?.status === "partial";
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-slate-50 transition-colors", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-4 py-3 text-lg text-slate-500 font-bold tabular-nums", children: [
              "#",
              loan.loanNumber
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(BorrowerAvatar, { name: loan.borrowerName, photoUrl: loan.borrowerPhotoUrl, size: "sm" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(NameDisplay, { name: loan.borrowerName, className: "font-medium text-slate-900" }),
                loan.borrowerArea && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400", children: loan.borrowerArea })
              ] })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: parseFloat(loan.primaryAmount), className: "font-semibold text-slate-900" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { status: loan.status, children: t(`loans.status${loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}`) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-4 py-3 min-w-[140px]", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: clsx("h-full rounded-full", loan.status === "completed" ? "bg-emerald-500" : "bg-primary"), style: {
                  width: `${progress}%`
                } }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-slate-500 tabular-nums w-8 text-right", children: [
                  progress,
                  "%"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-slate-400 mt-0.5", children: [
                loan.paidInstallments,
                "/",
                loan.totalInstallments
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: loan.nextPayment ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: clsx("text-xs font-semibold", nextOverdue ? "text-red-600" : nextPartial ? "text-amber-600" : "text-slate-700"), children: (/* @__PURE__ */ new Date(loan.nextPayment.dueDate + "T00:00:00")).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short"
              }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: parseFloat(loan.nextPayment.amountDue), className: "text-xs text-slate-500 block" })
            ] }) : loan.status === "completed" ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-emerald-600 font-medium", children: "All paid" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-slate-400", children: "—" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/loans/$loanId", params: {
              loanId: loan.id
            }, className: "text-primary hover:underline text-sm font-medium", children: [
              t("loans.loanDetails"),
              " →"
            ] }) })
          ] }, loan.id);
        }) })
      ] }) }),
      result.totalPages > 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between pt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", size: "sm", onClick: () => setPage((p) => Math.max(1, p - 1)), disabled: page === 1, children: t("common.back") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm text-slate-500", children: [
          page,
          " / ",
          result.totalPages
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", size: "sm", onClick: () => setPage((p) => Math.min(result.totalPages, p + 1)), disabled: page === result.totalPages, children: t("common.next") })
      ] })
    ] })
  ] });
}
function SummaryPill({
  label,
  color,
  onClick,
  active
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick, disabled: !onClick, className: clsx("shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors", color === "blue" && (active ? "bg-primary text-white border-primary" : "bg-primary/10 text-primary border-primary/20"), color === "red" && "bg-red-50 text-red-600 border-red-200", color === "amber" && "bg-amber-50 text-amber-700 border-amber-200", color === "slate" && (active ? "bg-slate-700 text-white border-slate-700" : "bg-slate-100 text-slate-600 border-slate-200"), onClick ? "cursor-pointer hover:opacity-80" : "cursor-default"), children: label });
}
export {
  LoansPage as component
};
