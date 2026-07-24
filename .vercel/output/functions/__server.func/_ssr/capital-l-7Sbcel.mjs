import { r as reactExports, j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { C as Card, a as CardTitle } from "./Card-BGH86XgU.mjs";
import { B as Button, e as createSsrRpc, t as toast } from "./router-_jeUSzJ6.mjs";
import { I as Input } from "./Input-DxOP6u0W.mjs";
import { S as Select } from "./Select-tn0N3Klx.mjs";
import { D as DatePicker } from "./DatePicker-Doyp9g9q.mjs";
import { S as Spinner } from "./Spinner-7dxOTM9g.mjs";
import { E as EmptyState } from "./EmptyState-CP7HaiDi.mjs";
import { C as CurrencyDisplay } from "./CurrencyDisplay-PB3v2V9D.mjs";
import { D as DateDisplay } from "./DateDisplay-XPhW4pFb.mjs";
import { N as NameDisplay } from "./NameDisplay-CsHOu8cU.mjs";
import { c as createServerFn } from "./index.mjs";
import { u as useTranslation } from "../_libs/react-i18next.mjs";
import "../_libs/clsx.mjs";
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
import "../_chunks/_libs/@tanstack/react-store.mjs";
import "../_libs/use-sync-external-store.mjs";
import "../_libs/i18next.mjs";
import "./auth-CwIywibs.mjs";
import "../_libs/joi.mjs";
import "../_chunks/_libs/@hapi/hoek.mjs";
import "../_chunks/_libs/@hapi/formula.mjs";
import "../_chunks/_libs/@hapi/pinpoint.mjs";
import "../_chunks/_libs/@hapi/topo.mjs";
import "../_chunks/_libs/@hapi/address.mjs";
import "url";
import "../_chunks/_libs/@hapi/tlds.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "./formatters-khdU1uWq.mjs";
const getCapitalBalance = createServerFn({
  method: "GET"
}).handler(createSsrRpc("cc11e524a6bf78967b71a718ff53a0b27099805b4c84beb43f5eb652c045bf60"));
const getCapitalLog = createServerFn({
  method: "GET"
}).inputValidator((data) => {
  const input = data;
  return {
    dateFrom: input.dateFrom || null,
    dateTo: input.dateTo || null,
    eventType: input.eventType || null
  };
}).handler(createSsrRpc("727e83e3ba9a6397583d7296131d393575f763162e2298693aa6ed034b64ed61"));
const addInvestment = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const input = data;
  if (!input.amount || input.amount <= 0) {
    throw new Error("Investment amount must be positive");
  }
  return {
    amount: input.amount,
    notes: input.notes || null
  };
}).handler(createSsrRpc("b5b76cdd5bf2632d2f5e9c07e7f1cee2047f8cc7b538a73532cb598e98860fc0"));
const eventColors = {
  investment: "bg-emerald-100 text-emerald-700",
  collection: "bg-blue-100 text-blue-700",
  disbursement: "bg-red-100 text-red-700"
};
function CapitalPage() {
  const {
    t
  } = useTranslation();
  const [balance, setBalance] = reactExports.useState(0);
  const [log, setLog] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [showInvestModal, setShowInvestModal] = reactExports.useState(false);
  const [eventType, setEventType] = reactExports.useState("all");
  const [dateFrom, setDateFrom] = reactExports.useState("");
  const [dateTo, setDateTo] = reactExports.useState("");
  const fetchData = reactExports.useCallback(async () => {
    setLoading(true);
    try {
      const [balResult, logResult] = await Promise.all([getCapitalBalance(), getCapitalLog({
        data: {
          eventType,
          dateFrom: dateFrom || void 0,
          dateTo: dateTo || void 0
        }
      })]);
      setBalance(balResult.balance);
      setLog(logResult);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [eventType, dateFrom, dateTo]);
  reactExports.useEffect(() => {
    fetchData();
  }, [fetchData]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mx-auto space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-slate-900", children: t("capital.title") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", onClick: () => setShowInvestModal(true), children: t("capital.addInvestment") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-500", children: t("capital.balance") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: balance, className: "text-3xl font-bold text-slate-900 mt-1" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Select, { value: eventType, onChange: (e) => setEventType(e.target.value), options: [{
        value: "all",
        label: t("common.all")
      }, {
        value: "investment",
        label: t("capital.investment")
      }, {
        value: "collection",
        label: t("capital.collection")
      }, {
        value: "disbursement",
        label: t("capital.disbursement")
      }] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { value: dateFrom, onChange: (e) => setDateFrom(e.target.value), placeholder: t("analytics.from") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { value: dateTo, onChange: (e) => setDateTo(e.target.value), placeholder: t("analytics.to") })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: t("capital.log") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Spinner, { size: "lg" }) }) : log.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { title: t("common.noData") }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-0", children: log.map((entry, index) => {
        const isLast = index === log.length - 1;
        const isPositive = entry.eventType !== "disbursement";
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${eventColors[entry.eventType]}`, children: [
              entry.eventType === "investment" && "+",
              entry.eventType === "collection" && "✓",
              entry.eventType === "disbursement" && "-"
            ] }),
            !isLast && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-0.5 flex-1 min-h-[16px] bg-slate-200" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 rounded-lg border border-slate-100 p-3 mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-sm font-medium ${eventColors[entry.eventType].split(" ")[1]}`, children: t(`capital.${entry.eventType}`) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(DateDisplay, { date: typeof entry.eventDate === "string" ? entry.eventDate : new Date(entry.eventDate).toISOString().split("T")[0], className: "text-xs text-slate-400" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mt-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: parseFloat(entry.amount), className: `text-sm font-semibold ${isPositive ? "text-emerald-600" : "text-red-600"}` }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-slate-400", children: [
                t("capital.balance"),
                ": ",
                /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: parseFloat(entry.runningBalance), className: "inline" })
              ] })
            ] }),
            entry.borrowerName && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-500", children: /* @__PURE__ */ jsxRuntimeExports.jsx(NameDisplay, { name: entry.borrowerName }) }),
            entry.notes && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-400", children: entry.notes })
          ] })
        ] }, entry.id);
      }) }) })
    ] }),
    showInvestModal && /* @__PURE__ */ jsxRuntimeExports.jsx(InvestmentModal, { onClose: () => setShowInvestModal(false), onSuccess: () => {
      setShowInvestModal(false);
      fetchData();
    } })
  ] });
}
function InvestmentModal({
  onClose,
  onSuccess
}) {
  const {
    t
  } = useTranslation();
  const [amount, setAmount] = reactExports.useState("");
  const [notes, setNotes] = reactExports.useState("");
  const [loading, setLoading] = reactExports.useState(false);
  const handleSubmit = async () => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      toast(t("common.required"), "error");
      return;
    }
    setLoading(true);
    try {
      await addInvestment({
        data: {
          amount: parsed,
          notes: notes || void 0
        }
      });
      toast(t("capital.addInvestment"), "success");
      onSuccess();
    } catch (err) {
      toast(err instanceof Error ? err.message : t("errors.generic"), "error");
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed inset-0 z-50 flex items-end sm:items-center justify-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-black/40", onClick: onClose }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sticky top-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between rounded-t-2xl", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-slate-900", children: t("capital.addInvestment") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: onClose, className: "min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600", children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-5 w-5", viewBox: "0 0 20 20", fill: "currentColor", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { fillRule: "evenodd", d: "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z", clipRule: "evenodd" }) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { label: t("capital.investmentAmount"), value: amount, onChange: (e) => setAmount(e.target.value.replace(/[^\d]/g, "")), inputMode: "numeric", lang: "en", leftIcon: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-500 text-sm", children: "₹" }), autoFocus: true }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: t("common.notes") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { value: notes, onChange: (e) => setNotes(e.target.value), rows: 2, className: "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors", placeholder: t("common.notes") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", onClick: onClose, className: "flex-1", children: t("common.cancel") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSubmit, loading, className: "flex-1", children: t("capital.addInvestment") })
        ] })
      ] })
    ] })
  ] });
}
export {
  CapitalPage as component
};
