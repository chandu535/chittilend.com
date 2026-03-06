import { r as reactExports, j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { u as useStore } from "../_chunks/_libs/@tanstack/react-store.mjs";
import { a as authStore, f as getDashboardSummary, h as getCashflowTimeline, i as getRecentActivity, B as Button } from "./router-De5441r5.mjs";
import { u as useLocalizedName, N as NameDisplay } from "./NameDisplay-B-OL-WuP.mjs";
import { S as Spinner } from "./Spinner-7dxOTM9g.mjs";
import { C as CurrencyDisplay } from "./CurrencyDisplay-Ca9SH7ZJ.mjs";
import { L as Link } from "../_chunks/_libs/@tanstack/react-router.mjs";
import { D as DateDisplay } from "./DateDisplay-j1uvyMji.mjs";
import { C as CollectionChart } from "./CollectionChart-CSwZnB5o.mjs";
import { b as bulkUpdateOverdueStatus } from "./payments-DIBCZgRG.mjs";
import { u as useTranslation } from "../_libs/react-i18next.mjs";
import "../_libs/use-sync-external-store.mjs";
import "../_chunks/_libs/@tanstack/router-core.mjs";
import "../_libs/cookie-es.mjs";
import "../_chunks/_libs/@tanstack/history.mjs";
import "../_libs/tiny-invariant.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_chunks/_libs/@tanstack/store.mjs";
import "../_libs/clsx.mjs";
import "../_libs/i18next.mjs";
import "./index.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "../_chunks/_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/tiny-warning.mjs";
import "./auth-CwIywibs.mjs";
import "../_libs/joi.mjs";
import "../_chunks/_libs/@hapi/hoek.mjs";
import "../_chunks/_libs/@hapi/formula.mjs";
import "../_chunks/_libs/@hapi/pinpoint.mjs";
import "../_chunks/_libs/@hapi/topo.mjs";
import "../_chunks/_libs/@hapi/address.mjs";
import "url";
import "../_chunks/_libs/@hapi/tlds.mjs";
import "./formatters-khdU1uWq.mjs";
import "./payment-jMyh0Ybg.mjs";
const icons = {
  deployed: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) }),
  available: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" }) }),
  collect: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75" }) }),
  profit: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" }) })
};
const cardConfig = [
  { key: "deployed", labelKey: "dashboard.totalDeployed", icon: icons.deployed, colorClass: "bg-blue-50 text-blue-600" },
  { key: "available", labelKey: "dashboard.availableCapital", icon: icons.available, colorClass: "bg-emerald-50 text-emerald-600" },
  { key: "collect", labelKey: "dashboard.toCollect", icon: icons.collect, colorClass: "bg-amber-50 text-amber-600" },
  { key: "profit", labelKey: "dashboard.profitEarned", icon: icons.profit, colorClass: "bg-purple-50 text-purple-600" }
];
const valueMap = {
  deployed: "totalDeployed",
  available: "availableCapital",
  collect: "toCollect",
  profit: "profitEarned"
};
function SummaryCards({ data }) {
  const { t } = useTranslation();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-3", children: cardConfig.map((card) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "rounded-xl border border-slate-100 bg-white p-4 shadow-sm",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2 mb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `rounded-lg p-1.5 ${card.colorClass}`, children: card.icon }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          CurrencyDisplay,
          {
            amount: data[valueMap[card.key]],
            className: "text-xl font-bold text-slate-900"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500 mt-1", children: t(card.labelKey) })
      ]
    },
    card.key
  )) });
}
function OverdueAlerts({ count }) {
  const { t } = useTranslation();
  if (count === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-emerald-600 text-lg font-bold", children: "✓" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-emerald-700", children: t("dashboard.noOverdue") })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/payments", className: "block", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-3 hover:bg-red-100/50 transition-colors", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-600 text-lg", children: "!!" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-red-700 flex-1", children: t("dashboard.overdueAlert", { count }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-5 w-5 text-red-400", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 5l7 7-7 7" }) })
  ] }) });
}
const eventIcons = {
  collection: { icon: "↓", color: "bg-emerald-100 text-emerald-700" },
  disbursement: { icon: "↑", color: "bg-red-100 text-red-700" },
  investment: { icon: "+", color: "bg-blue-100 text-blue-700" }
};
function RecentActivity({ items }) {
  const { t } = useTranslation();
  if (items.length === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-100 bg-white shadow-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 py-3 border-b border-slate-100", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-slate-900", children: t("dashboard.recentActivity") }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "divide-y divide-slate-50", children: items.map((item) => {
      const cfg = eventIcons[item.eventType];
      const dateStr = typeof item.eventDate === "string" ? item.eventDate : new Date(item.eventDate).toISOString().split("T")[0];
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 px-4 py-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${cfg.color}`, children: cfg.icon }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-medium text-slate-700 truncate", children: [
            t(`capital.${item.eventType}`),
            item.borrowerName && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-slate-400", children: [
              " — ",
              /* @__PURE__ */ jsxRuntimeExports.jsx(NameDisplay, { name: item.borrowerName })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DateDisplay, { date: dateStr, className: "text-xs text-slate-400" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right shrink-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            CurrencyDisplay,
            {
              amount: item.amount,
              className: `text-sm font-semibold ${item.eventType === "disbursement" ? "text-red-600" : "text-emerald-600"}`
            }
          ),
          item.loanId && /* @__PURE__ */ jsxRuntimeExports.jsx(
            Link,
            {
              to: "/loans/$loanId",
              params: { loanId: item.loanId },
              className: "text-xs text-primary hover:underline block",
              children: t("loans.loanDetails")
            }
          )
        ] })
      ] }, item.id);
    }) })
  ] });
}
function QuickActions() {
  const { t } = useTranslation();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/loans/new", className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "w-full", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 4.5v15m7.5-7.5h-15" }) }),
      t("loans.newLoan")
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/payments", className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", className: "w-full", children: t("payments.markPaid") }) })
  ] });
}
function getGreetingKey() {
  const hour = (/* @__PURE__ */ new Date()).getHours();
  if (hour < 12) return "greeting.morning";
  if (hour < 17) return "greeting.afternoon";
  return "greeting.evening";
}
function DashboardPage() {
  const {
    t
  } = useTranslation();
  const user = useStore(authStore, (s) => s.user);
  const userName = useLocalizedName(user?.name || "");
  const [loading, setLoading] = reactExports.useState(true);
  const [summary, setSummary] = reactExports.useState(null);
  const [cashflow, setCashflow] = reactExports.useState([]);
  const [activity, setActivity] = reactExports.useState([]);
  reactExports.useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        await bulkUpdateOverdueStatus();
        const [summaryData, cashflowData, activityData] = await Promise.all([getDashboardSummary(), getCashflowTimeline({
          data: {}
        }), getRecentActivity()]);
        setSummary(summaryData);
        setCashflow(cashflowData);
        setActivity(activityData);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Spinner, { size: "lg" }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mx-auto space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-2xl font-bold text-slate-900", children: [
        t(getGreetingKey()),
        user ? `, ${userName}` : ""
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-500 mt-0.5", children: t("dashboard.subtitle") })
    ] }),
    summary && /* @__PURE__ */ jsxRuntimeExports.jsx(OverdueAlerts, { count: summary.overduePayments }),
    summary && /* @__PURE__ */ jsxRuntimeExports.jsx(SummaryCards, { data: {
      totalDeployed: summary.totalDeployed,
      availableCapital: summary.availableCapital,
      toCollect: summary.toCollect,
      profitEarned: summary.profitEarned
    } }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(QuickActions, {}),
    summary && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-100 bg-white p-4 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: t("dashboard.thisMonthCollected") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-lg font-bold text-emerald-600 mt-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline", children: summary.thisMonthCollected > 0 ? "+" : "" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 0
          }).format(summary.thisMonthCollected) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-100 bg-white p-4 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: t("dashboard.thisMonthGiven") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-bold text-red-600 mt-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          minimumFractionDigits: 0
        }).format(summary.thisMonthDisbursed) }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CollectionChart, { data: cashflow }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(RecentActivity, { items: activity }),
    summary && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-100 bg-white p-4 shadow-sm text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-bold text-primary", children: summary.activeLoans }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500 mt-1", children: t("dashboard.activeLoans") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-100 bg-white p-4 shadow-sm text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-bold text-red-600", children: summary.overduePayments }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500 mt-1", children: t("dashboard.overduePayments") })
      ] })
    ] })
  ] });
}
export {
  DashboardPage as component
};
