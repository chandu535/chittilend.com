import { r as reactExports, j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { L as Link } from "../_chunks/_libs/@tanstack/react-router.mjs";
import { C as Card } from "./Card-BGH86XgU.mjs";
import { B as Badge } from "./Badge-BExCBNfX.mjs";
import { B as Button } from "./router-_jeUSzJ6.mjs";
import { S as Spinner } from "./Spinner-7dxOTM9g.mjs";
import { E as EmptyState } from "./EmptyState-CP7HaiDi.mjs";
import { C as CurrencyDisplay } from "./CurrencyDisplay-PB3v2V9D.mjs";
import { D as DateDisplay } from "./DateDisplay-XPhW4pFb.mjs";
import { N as NameDisplay } from "./NameDisplay-CsHOu8cU.mjs";
import { P as PaymentMarkModal } from "./PaymentMarkModal-jBpXFuk-.mjs";
import { b as bulkUpdateOverdueStatus, l as listUpcomingPayments, a as listOverduePayments, c as listRecentPayments } from "./payments-CHDZNyrx.mjs";
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
import "../_libs/clsx.mjs";
import "./constants-CT9Kuti2.mjs";
import "../_chunks/_libs/@tanstack/store.mjs";
import "../_chunks/_libs/@tanstack/react-store.mjs";
import "../_libs/use-sync-external-store.mjs";
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
import "./formatters-khdU1uWq.mjs";
import "./Input-DxOP6u0W.mjs";
import "./Select-tn0N3Klx.mjs";
import "./DatePicker-Doyp9g9q.mjs";
import "./payment-jMyh0Ybg.mjs";
function PaymentsPage() {
  const {
    t
  } = useTranslation();
  const [tab, setTab] = reactExports.useState("upcoming");
  const [loading, setLoading] = reactExports.useState(true);
  const [data, setData] = reactExports.useState([]);
  const [selectedPayment, setSelectedPayment] = reactExports.useState(null);
  const fetchData = reactExports.useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "overdue") {
        await bulkUpdateOverdueStatus();
      }
      let result;
      if (tab === "upcoming") {
        result = await listUpcomingPayments({
          data: {
            days: 14
          }
        });
      } else if (tab === "overdue") {
        result = await listOverduePayments();
      } else {
        result = await listRecentPayments();
      }
      setData(result);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);
  reactExports.useEffect(() => {
    fetchData();
  }, [fetchData]);
  const tabs = [{
    key: "upcoming",
    label: t("payments.upcoming")
  }, {
    key: "overdue",
    label: t("payments.overdue")
  }, {
    key: "recent",
    label: t("payments.recent")
  }];
  const isActionable = tab !== "recent";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-slate-900", children: t("payments.title") }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1 rounded-lg bg-slate-100 p-1", children: tabs.map((t2) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setTab(t2.key), className: `flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors min-h-[40px] ${tab === t2.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`, children: t2.label }, t2.key)) }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Spinner, { size: "lg" }) }) : data.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { title: tab === "overdue" ? t("payments.noOverdue") : t("payments.noUpcoming") }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sm:hidden space-y-3", children: data.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/loans/$loanId", params: {
            loanId: p.loanId
          }, className: "font-medium text-slate-900 hover:text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(NameDisplay, { name: p.borrowerName }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { status: p.status, children: t(`payments.${p.status}`) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-500", children: t("payments.installmentNo", {
            number: p.installmentNumber
          }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: parseFloat(p.amountDue), className: "font-semibold" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mt-1 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DateDisplay, { date: tab === "recent" && p.paidDate ? p.paidDate : p.dueDate, className: "text-slate-500" }),
          isActionable && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", onClick: () => setSelectedPayment(p), children: t("payments.markPaid") })
        ] })
      ] }, p.id)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden sm:block overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-slate-200 text-left text-slate-500", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-3 font-medium", children: t("borrowers.name") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-3 font-medium", children: t("payments.installmentNo", {
            number: ""
          }).replace("#", "#") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-3 font-medium", children: tab === "recent" ? t("payments.paidDate") : t("payments.dueDate") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-3 font-medium", children: t("payments.amountDue") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-3 font-medium", children: t("common.status") }),
          isActionable && /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-3 font-medium", children: t("common.actions") })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-slate-100", children: data.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: `hover:bg-slate-50 ${p.status === "overdue" ? "bg-red-50/50" : ""}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/loans/$loanId", params: {
            loanId: p.loanId
          }, className: "font-medium text-slate-900 hover:text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(NameDisplay, { name: p.borrowerName }) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "py-3 text-slate-600", children: [
            "#",
            p.installmentNumber
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DateDisplay, { date: tab === "recent" && p.paidDate ? p.paidDate : p.dueDate, className: "text-slate-600" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: parseFloat(p.amountDue), className: "font-medium" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { status: p.status, children: t(`payments.${p.status}`) }) }),
          isActionable && /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", onClick: () => setSelectedPayment(p), children: t("payments.markPaid") }) })
        ] }, p.id)) })
      ] }) })
    ] }),
    selectedPayment && /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentMarkModal, { payment: selectedPayment, onClose: () => setSelectedPayment(null), onSuccess: () => {
      setSelectedPayment(null);
      fetchData();
    } })
  ] });
}
export {
  PaymentsPage as component
};
