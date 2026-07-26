import { r as reactExports, j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { u as useStore } from "../_chunks/_libs/@tanstack/react-store.mjs";
import { a as authStore, h as getCashflowTimeline, j as getAreaBreakdown, k as getBorrowerRanking, m as getStatusDistribution, n as getMonthlySnapshot, f as getDashboardSummary, B as Button, u as uiStore } from "./router-BkdMoR6V.mjs";
import { P as PageSkeleton } from "./PageSkeleton-CL8u5l4B.mjs";
import { D as DatePicker } from "./DatePicker-Doyp9g9q.mjs";
import { C as CurrencyDisplay } from "./CurrencyDisplay-DxtEIDNl.mjs";
import { N as NameDisplay } from "./NameDisplay-BEn732AH.mjs";
import { f as formatNumber, a as formatMonthYear, b as formatPercent } from "./formatters-khdU1uWq.mjs";
import { C as CollectionChart } from "./CollectionChart-KrFb3Awu.mjs";
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
import "../_chunks/_libs/@tanstack/react-router.mjs";
import "../_chunks/_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/tiny-warning.mjs";
import "../_chunks/_libs/@tanstack/store.mjs";
import "../_libs/clsx.mjs";
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
function getPresetRange(preset) {
  const now = /* @__PURE__ */ new Date();
  const to = now.toISOString().split("T")[0];
  switch (preset) {
    case "thisWeek": {
      const day = now.getDay();
      const start = new Date(now);
      start.setDate(now.getDate() - day);
      return { from: start.toISOString().split("T")[0], to };
    }
    case "thisMonth": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: start.toISOString().split("T")[0], to };
    }
    case "thisYear": {
      const start = new Date(now.getFullYear(), 0, 1);
      return { from: start.toISOString().split("T")[0], to };
    }
    default:
      return { from: "", to: "" };
  }
}
function TimeFilter({ onRangeChange }) {
  const { t } = useTranslation();
  const [active, setActive] = reactExports.useState("thisMonth");
  const [customFrom, setCustomFrom] = reactExports.useState("");
  const [customTo, setCustomTo] = reactExports.useState("");
  const presets = [
    { key: "thisWeek", label: t("analytics.thisWeek") },
    { key: "thisMonth", label: t("analytics.thisMonth") },
    { key: "thisYear", label: t("analytics.thisYear") },
    { key: "custom", label: t("analytics.custom") }
  ];
  const handlePreset = (preset) => {
    setActive(preset);
    if (preset !== "custom") {
      const range = getPresetRange(preset);
      onRangeChange(range.from, range.to);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1 rounded-lg bg-slate-100 p-1", children: presets.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        onClick: () => handlePreset(p.key),
        className: `flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors min-h-[36px] ${active === p.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`,
        children: p.label
      },
      p.key
    )) }),
    active === "custom" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 items-end", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        DatePicker,
        {
          label: t("analytics.from"),
          value: customFrom,
          onChange: (e) => setCustomFrom(e.target.value)
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        DatePicker,
        {
          label: t("analytics.to"),
          value: customTo,
          onChange: (e) => setCustomTo(e.target.value)
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          size: "sm",
          onClick: () => {
            if (customFrom && customTo) onRangeChange(customFrom, customTo);
          },
          disabled: !customFrom || !customTo,
          children: t("analytics.apply")
        }
      )
    ] })
  ] });
}
function AreaBreakdown({ data }) {
  const { t } = useTranslation();
  if (data.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-100 bg-white shadow-sm p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-slate-900 mb-3", children: t("analytics.areaBreakdown") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-400 py-4 text-center", children: t("analytics.noData") })
    ] });
  }
  const maxLent = Math.max(...data.map((d) => d.totalLent), 1);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-100 bg-white shadow-sm p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-slate-900 mb-3", children: t("analytics.areaBreakdown") }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: data.map((d) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-sm mb-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-slate-700 truncate", children: d.area }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: d.totalLent, className: "font-semibold text-slate-900 shrink-0" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 rounded-full bg-slate-100 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "h-full rounded-full bg-primary transition-all",
          style: { width: `${d.totalLent / maxLent * 100}%` }
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 mt-1 text-xs text-slate-400", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          d.loanCount,
          " ",
          t("nav.loans").toLowerCase()
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          d.borrowerCount,
          " ",
          t("nav.borrowers").toLowerCase()
        ] }),
        d.defaults > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-red-500", children: [
          d.defaults,
          " ",
          t("loans.statusDefaulted").toLowerCase()
        ] })
      ] })
    ] }, d.area)) })
  ] });
}
function BorrowerStats({ data }) {
  const { t } = useTranslation();
  const lang = useStore(uiStore, (s) => s.language);
  const [sortBy, setSortBy] = reactExports.useState("onTimePercent");
  const [sortDir, setSortDir] = reactExports.useState("desc");
  const sorted = [...data].sort((a, b) => {
    const mul = sortDir === "asc" ? 1 : -1;
    if (sortBy === "name") return mul * a.name.localeCompare(b.name);
    return mul * (a[sortBy] - b[sortBy]);
  });
  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir((d) => d === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortDir("desc");
    }
  };
  const sortIcon = (key) => {
    if (sortBy !== key) return "";
    return sortDir === "asc" ? " ▲" : " ▼";
  };
  if (data.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-100 bg-white shadow-sm p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-slate-900 mb-3", children: t("analytics.borrowerStats") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-400 py-4 text-center", children: t("analytics.noData") })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-100 bg-white shadow-sm p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-slate-900 mb-3", children: t("analytics.borrowerStats") }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sm:hidden space-y-2", children: sorted.map((b) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-slate-100 p-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center mb-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(NameDisplay, { name: b.name, className: "font-medium text-sm text-slate-900" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-xs font-semibold ${b.onTimePercent >= 80 ? "text-emerald-600" : b.onTimePercent >= 50 ? "text-amber-600" : "text-red-600"}`, children: formatPercent(b.onTimePercent, { lang }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-xs text-slate-400", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: b.area }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: b.totalBorrowed, className: "text-slate-600" })
      ] })
    ] }, b.id)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden sm:block overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-slate-200 text-left text-slate-500", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("th", { className: "pb-2 font-medium cursor-pointer", onClick: () => handleSort("name"), children: [
          t("borrowers.name"),
          sortIcon("name")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-2 font-medium", children: t("borrowers.area") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("th", { className: "pb-2 font-medium cursor-pointer text-right", onClick: () => handleSort("onTimePercent"), children: [
          t("analytics.onTimeRate"),
          sortIcon("onTimePercent")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("th", { className: "pb-2 font-medium cursor-pointer text-right", onClick: () => handleSort("totalBorrowed"), children: [
          t("analytics.amountGiven"),
          sortIcon("totalBorrowed")
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-slate-50", children: sorted.map((b) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-slate-50", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2 font-medium text-slate-900", children: /* @__PURE__ */ jsxRuntimeExports.jsx(NameDisplay, { name: b.name }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2 text-slate-500", children: b.area }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `font-semibold ${b.onTimePercent >= 80 ? "text-emerald-600" : b.onTimePercent >= 50 ? "text-amber-600" : "text-red-600"}`, children: formatPercent(b.onTimePercent, { lang }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: b.totalBorrowed, className: "font-medium" }) })
      ] }, b.id)) })
    ] }) })
  ] });
}
const statusColors = {
  active: "#3b82f6",
  completed: "#10b981",
  defaulted: "#ef4444",
  extended: "#f59e0b"
};
function StatusPieChart({ data }) {
  const { t } = useTranslation();
  const lang = useStore(uiStore, (s) => s.language);
  const total = data.reduce((sum, d) => sum + d.count, 0);
  if (total === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-100 bg-white shadow-sm p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-slate-900 mb-3", children: t("analytics.loanStatus") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-400 py-4 text-center", children: t("analytics.noData") })
    ] });
  }
  const size = 120;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const segments = data.filter((d) => d.count > 0).map((d) => {
    const pct = d.count / total;
    const dashLength = pct * circumference;
    const dashOffset = -offset;
    offset += dashLength;
    return {
      ...d,
      pct,
      dashLength,
      dashOffset,
      color: statusColors[d.status] || "#94a3b8"
    };
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-100 bg-white shadow-sm p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-slate-900 mb-3", children: t("analytics.loanStatus") }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative shrink-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: size, height: size, viewBox: `0 0 ${size} ${size}`, children: segments.map((seg) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "circle",
          {
            cx: size / 2,
            cy: size / 2,
            r: radius,
            fill: "none",
            stroke: seg.color,
            strokeWidth,
            strokeDasharray: `${seg.dashLength} ${circumference - seg.dashLength}`,
            strokeDashoffset: seg.dashOffset,
            transform: `rotate(-90 ${size / 2} ${size / 2})`
          },
          seg.status
        )) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg font-bold text-slate-900", children: formatNumber(total, { lang }) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 flex-1", children: segments.map((seg) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "h-3 w-3 rounded-sm shrink-0",
            style: { backgroundColor: seg.color }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-slate-600 flex-1", children: t(`loans.status${seg.status.charAt(0).toUpperCase() + seg.status.slice(1)}`) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold text-slate-900", children: formatNumber(seg.count, { lang }) })
      ] }, seg.status)) })
    ] })
  ] });
}
function MonthlySnapshot({ current, previous }) {
  const { t } = useTranslation();
  const lang = useStore(uiStore, (s) => s.language);
  if (!current) return null;
  const rows = [
    {
      label: t("analytics.amountGiven"),
      currentVal: "",
      prevVal: "",
      isCurrency: true
    },
    {
      label: t("analytics.amountCollected"),
      currentVal: "",
      prevVal: "",
      isCurrency: true
    },
    {
      label: t("analytics.totalLoans"),
      currentVal: formatNumber(current.loansGivenCount, { lang }),
      prevVal: previous ? formatNumber(previous.loansGivenCount, { lang }) : "—"
    },
    {
      label: t("borrowers.newBorrower"),
      currentVal: formatNumber(current.newBorrowers, { lang }),
      prevVal: previous ? formatNumber(previous.newBorrowers, { lang }) : "—"
    }
  ];
  const currentDate = new Date(current.year, current.month - 1, 1);
  const prevDate = previous ? new Date(previous.year, previous.month - 1, 1) : null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-100 bg-white shadow-sm p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-slate-900 mb-3", children: t("analytics.monthlyComparison") }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-slate-200 text-slate-500", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-2 text-left font-medium" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-2 text-right font-medium", children: formatMonthYear(currentDate, { lang }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-2 text-right font-medium", children: prevDate ? formatMonthYear(prevDate, { lang }) : "—" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { className: "divide-y divide-slate-50", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2 text-slate-600", children: t("analytics.amountGiven") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: current.loansGivenAmount, className: "font-medium" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2 text-right text-slate-400", children: previous ? /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: previous.loansGivenAmount }) : "—" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2 text-slate-600", children: t("analytics.amountCollected") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: current.collected, className: "font-medium" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2 text-right text-slate-400", children: previous ? /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: previous.collected }) : "—" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2 text-slate-600", children: t("analytics.totalLoans") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2 text-right font-medium", children: rows[2].currentVal }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2 text-right text-slate-400", children: rows[2].prevVal })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2 text-slate-600", children: t("borrowers.newBorrower") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2 text-right font-medium", children: rows[3].currentVal }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2 text-right text-slate-400", children: rows[3].prevVal })
        ] })
      ] })
    ] })
  ] });
}
function AnalyticsPage() {
  const {
    t
  } = useTranslation();
  const user = useStore(authStore, (s) => s.user);
  const isAdmin = user?.role === "admin";
  const now = /* @__PURE__ */ new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const defaultTo = now.toISOString().split("T")[0];
  const [dateFrom, setDateFrom] = reactExports.useState(defaultFrom);
  const [dateTo, setDateTo] = reactExports.useState(defaultTo);
  const [loading, setLoading] = reactExports.useState(true);
  const [cashflow, setCashflow] = reactExports.useState([]);
  const [areas, setAreas] = reactExports.useState([]);
  const [borrowers, setBorrowers] = reactExports.useState([]);
  const [statuses, setStatuses] = reactExports.useState([]);
  const [currentMonth, setCurrentMonth] = reactExports.useState(null);
  const [prevMonth, setPrevMonth] = reactExports.useState(null);
  const [summary, setSummary] = reactExports.useState(null);
  const fetchData = reactExports.useCallback(async () => {
    setLoading(true);
    try {
      const prevMonthNum = now.getMonth() === 0 ? 12 : now.getMonth();
      const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const results = await Promise.all([getCashflowTimeline({
        data: {
          dateFrom,
          dateTo
        }
      }), getAreaBreakdown({
        data: {
          dateFrom,
          dateTo
        }
      }), getBorrowerRanking(), getStatusDistribution(), getMonthlySnapshot({
        data: {
          month: now.getMonth() + 1,
          year: now.getFullYear()
        }
      }), getMonthlySnapshot({
        data: {
          month: prevMonthNum,
          year: prevYear
        }
      }), getDashboardSummary()]);
      setCashflow(results[0]);
      setAreas(results[1]);
      setBorrowers(results[2]);
      setStatuses(results[3]);
      setCurrentMonth(results[4]);
      setPrevMonth(results[5]);
      setSummary(results[6]);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);
  reactExports.useEffect(() => {
    fetchData();
  }, [fetchData]);
  const handleRangeChange = (from, to) => {
    setDateFrom(from);
    setDateTo(to);
  };
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(PageSkeleton, { variant: "dashboard" });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-4xl mx-auto space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-slate-900", children: t("analytics.title") }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TimeFilter, { onRangeChange: handleRangeChange }),
    summary && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-100 bg-white p-3 shadow-sm text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: summary.totalDeployed, className: "text-lg font-bold text-slate-900" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500 mt-1", children: t("dashboard.totalDeployed") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-100 bg-white p-3 shadow-sm text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: summary.toCollect, className: "text-lg font-bold text-amber-600" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500 mt-1", children: t("analytics.amountPending") })
      ] }),
      isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-100 bg-white p-3 shadow-sm text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: summary.profitEarned, className: "text-lg font-bold text-emerald-600" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500 mt-1", children: t("analytics.profitRealized") })
      ] }),
      !isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-100 bg-white p-3 shadow-sm text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-bold text-slate-900", children: statuses.reduce((s, d) => s + d.count, 0) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500 mt-1", children: t("analytics.totalLoans") })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sm:col-span-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CollectionChart, { data: cashflow }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatusPieChart, { data: statuses }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(AreaBreakdown, { data: areas })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(MonthlySnapshot, { current: currentMonth, previous: prevMonth }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(BorrowerStats, { data: borrowers })
  ] });
}
export {
  AnalyticsPage as component
};
