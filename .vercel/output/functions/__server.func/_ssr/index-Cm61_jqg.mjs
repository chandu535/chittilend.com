import { r as reactExports, j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { L as Link } from "../_chunks/_libs/@tanstack/react-router.mjs";
import { l as listLoans } from "./loans-EIa1sntp.mjs";
import { B as Button } from "./router-De5441r5.mjs";
import { I as Input } from "./Input-CQaLwuWI.mjs";
import { S as Select } from "./Select-tn0N3Klx.mjs";
import { B as Badge } from "./Badge-_eeoowG6.mjs";
import { C as CurrencyDisplay } from "./CurrencyDisplay-Ca9SH7ZJ.mjs";
import { D as DateDisplay } from "./DateDisplay-j1uvyMji.mjs";
import { N as NameDisplay, u as useLocalizedName } from "./NameDisplay-B-OL-WuP.mjs";
import { E as EmptyState } from "./EmptyState-CP7HaiDi.mjs";
import { S as Spinner } from "./Spinner-7dxOTM9g.mjs";
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
import "../_chunks/_libs/@tanstack/store.mjs";
import "../_chunks/_libs/@tanstack/react-store.mjs";
import "../_libs/use-sync-external-store.mjs";
import "../_libs/clsx.mjs";
import "../_libs/i18next.mjs";
import "./auth-CwIywibs.mjs";
import "./formatters-khdU1uWq.mjs";
function LoanCard({
  id,
  borrowerName,
  primaryAmount,
  status,
  totalInstallments,
  paidInstallments,
  dateGiven
}) {
  const { t } = useTranslation();
  const displayName = useLocalizedName(borrowerName);
  const progress = totalInstallments > 0 ? paidInstallments / totalInstallments * 100 : 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Link,
    {
      to: "/loans/$loanId",
      params: { loanId: id },
      className: "block rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between mb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-slate-900 truncate", children: displayName }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              CurrencyDisplay,
              {
                amount: parseFloat(primaryAmount),
                className: "text-lg font-bold text-slate-900"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { status, children: t(`loans.status${status.charAt(0).toUpperCase() + status.slice(1)}`) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-xs text-slate-500 mb-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t("loans.progress", { paid: paidInstallments, total: totalInstallments }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DateDisplay, { date: dateGiven, className: "text-slate-400" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1.5 rounded-full bg-slate-100 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "h-full rounded-full bg-primary transition-all",
              style: { width: `${progress}%` }
            }
          ) })
        ] })
      ]
    }
  );
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
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-slate-900", children: t("loans.title") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/loans/new", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", children: t("loans.newLoan") }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: t("common.search"), value: search, onChange: (e) => setSearch(e.target.value), leftIcon: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }) }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Select, { value: status, onChange: (e) => {
        setStatus(e.target.value);
        setPage(1);
      }, options: statusOptions })
    ] }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Spinner, { size: "lg" }) }) : result.items.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { title: t("loans.noLoans"), action: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/loans/new", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { children: t("loans.newLoan") }) }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sm:hidden space-y-3", children: result.items.map((loan) => /* @__PURE__ */ jsxRuntimeExports.jsx(LoanCard, { id: loan.id, borrowerName: loan.borrowerName, primaryAmount: loan.primaryAmount, status: loan.status, totalInstallments: loan.totalInstallments, paidInstallments: 0, dateGiven: loan.dateGiven }, loan.id)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden sm:block overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-slate-200 text-left text-slate-500", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-3 font-medium", children: t("borrowers.name") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-3 font-medium", children: t("loans.primaryAmount") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-3 font-medium", children: t("common.status") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-3 font-medium", children: t("loans.tenure") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-3 font-medium", children: t("common.actions") })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-slate-100", children: result.items.map((loan) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-slate-50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 font-medium text-slate-900", children: /* @__PURE__ */ jsxRuntimeExports.jsx(NameDisplay, { name: loan.borrowerName }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: parseFloat(loan.primaryAmount) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { status: loan.status, children: t(`loans.status${loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}`) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "py-3 text-slate-600", children: [
            loan.tenureMonths,
            " ",
            t("loans.months")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/loans/$loanId", params: {
            loanId: loan.id
          }, className: "text-primary hover:underline text-sm", children: t("loans.loanDetails") }) })
        ] }, loan.id)) })
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
export {
  LoansPage as component
};
