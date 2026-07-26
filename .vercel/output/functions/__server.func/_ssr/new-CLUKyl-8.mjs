import { r as reactExports, j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { u as useNavigate } from "../_chunks/_libs/@tanstack/react-router.mjs";
import { C as Card, a as CardTitle } from "./Card-BGH86XgU.mjs";
import { I as Input } from "./Input-DxOP6u0W.mjs";
import { S as Select } from "./Select-tn0N3Klx.mjs";
import { D as DatePicker } from "./DatePicker-Doyp9g9q.mjs";
import { B as Button, t as toast } from "./router-BkdMoR6V.mjs";
import { C as CurrencyDisplay } from "./CurrencyDisplay-DxtEIDNl.mjs";
import { D as DateDisplay } from "./DateDisplay-B5D35cED.mjs";
import { N as NameDisplay } from "./NameDisplay-BEn732AH.mjs";
import { s as searchBorrowers, u as updateBorrower, c as createBorrower } from "./borrowers-DZZMFZOE.mjs";
import { c as createLoan } from "./loans-DdW0j3QS.mjs";
import { c as calculateLoan, a as calculateStartMonth, g as generatePaymentSchedule } from "./calculations-DjV5_5Ok.mjs";
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
import "./borrower-Bf161yIl.mjs";
import "./constants-CT9Kuti2.mjs";
import "./loan-Dc_xM90c.mjs";
function AutoCalcPreview({ calc }) {
  const { t } = useTranslation();
  if (!calc) return null;
  const rows = [
    { label: t("loans.primaryAmount"), value: calc.primaryAmount },
    { label: t("loans.serviceCharge"), value: calc.serviceChargeAmount, muted: true },
    { label: t("loans.amountReceived"), value: calc.amountUserReceives },
    { label: t("loans.totalRepayment"), value: calc.totalRepayment, bold: true },
    { label: t("loans.installment"), value: calc.installmentAmount },
    { label: t("loans.profit"), value: calc.profitAmount, success: true }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-2", children: rows.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: row.muted ? "text-slate-400" : "text-slate-600", children: row.label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      CurrencyDisplay,
      {
        amount: row.value,
        className: row.bold ? "font-bold text-slate-900" : row.success ? "font-semibold text-emerald-600" : row.muted ? "text-slate-400" : "font-medium text-slate-900"
      }
    )
  ] }, row.label)) });
}
function NewLoanPage() {
  const {
    t
  } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = reactExports.useState("borrower");
  const [loading, setLoading] = reactExports.useState(false);
  const [borrowerMode, setBorrowerMode] = reactExports.useState("search");
  const [borrowerQuery, setBorrowerQuery] = reactExports.useState("");
  const [borrowerResults, setBorrowerResults] = reactExports.useState([]);
  const [selectedBorrower, setSelectedBorrower] = reactExports.useState(null);
  const [newBorrower, setNewBorrower] = reactExports.useState({
    name: "",
    mobile: "",
    area: "",
    address: ""
  });
  const [newBorrowerErrors, setNewBorrowerErrors] = reactExports.useState({});
  const [creatingBorrower, setCreatingBorrower] = reactExports.useState(false);
  const [createdBorrowerId, setCreatedBorrowerId] = reactExports.useState(null);
  const [primaryAmount, setPrimaryAmount] = reactExports.useState("");
  const [tenureMonths, setTenureMonths] = reactExports.useState(5);
  const [frequency, setFrequency] = reactExports.useState("monthly");
  const [dateGiven, setDateGiven] = reactExports.useState((/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
  const calc = reactExports.useMemo(() => {
    const amount = parseFloat(primaryAmount);
    if (!amount || amount < 1e3) return null;
    return calculateLoan(amount, tenureMonths, frequency);
  }, [primaryAmount, tenureMonths, frequency]);
  const schedule = reactExports.useMemo(() => {
    if (!calc || !dateGiven) return [];
    const startMonth = calculateStartMonth(new Date(dateGiven));
    return generatePaymentSchedule(startMonth, calc.totalRepayment, calc.totalInstallments, frequency);
  }, [calc, dateGiven, frequency]);
  function validateNewBorrower(data) {
    const errors = {};
    if (!data.name.trim() || data.name.trim().length < 2) errors.name = "Name must be at least 2 characters";
    if (!/^[6-9]\d{9}$/.test(data.mobile)) errors.mobile = "Enter a valid 10-digit Indian mobile number";
    return errors;
  }
  const handleStep1Next = async () => {
    if (borrowerMode === "search") {
      setStep("amount");
      return;
    }
    const errors = validateNewBorrower(newBorrower);
    if (Object.keys(errors).length > 0) {
      setNewBorrowerErrors(errors);
      return;
    }
    setCreatingBorrower(true);
    try {
      const borrowerData = {
        name: newBorrower.name.trim(),
        mobile: newBorrower.mobile,
        area: newBorrower.area.trim() || void 0,
        address: newBorrower.address.trim() || void 0,
        suretyType: "owner"
      };
      const borrower = createdBorrowerId ? await updateBorrower({
        data: {
          id: createdBorrowerId,
          ...borrowerData
        }
      }) : await createBorrower({
        data: borrowerData
      });
      setCreatedBorrowerId(borrower.id);
      setSelectedBorrower({
        id: borrower.id,
        name: borrower.name,
        mobile: borrower.mobile,
        area: borrower.area
      });
      setStep("amount");
    } catch (err) {
      setNewBorrowerErrors({
        mobile: err instanceof Error ? err.message : "Failed to create borrower"
      });
    } finally {
      setCreatingBorrower(false);
    }
  };
  const handleBorrowerSearch = async (query) => {
    setBorrowerQuery(query);
    if (query.length < 1) {
      setBorrowerResults([]);
      return;
    }
    try {
      const results = await searchBorrowers({
        data: {
          query
        }
      });
      setBorrowerResults(results);
    } catch {
      setBorrowerResults([]);
    }
  };
  const handleSubmit = async () => {
    if (!selectedBorrower || !calc) return;
    setLoading(true);
    try {
      const loan = await createLoan({
        data: {
          borrowerId: selectedBorrower.id,
          dateGiven,
          primaryAmount: parseFloat(primaryAmount),
          tenureMonths,
          paymentFrequency: frequency,
          serviceChargePercent: 1,
          markupPercent: 25
        }
      });
      toast(t("loans.newLoan") + " created", "success");
      navigate({
        to: "/loans/$loanId",
        params: {
          loanId: loan.id
        }
      });
    } catch (err) {
      toast(err instanceof Error ? err.message : t("errors.generic"), "error");
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-lg mx-auto space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-slate-900", children: t("loans.createTitle") }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1", children: ["borrower", "amount", "schedule", "confirm"].map((s, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `h-1 flex-1 rounded-full ${["borrower", "amount", "schedule", "confirm"].indexOf(step) >= i ? "bg-primary" : "bg-slate-200"}` }, s)) }),
    step === "borrower" && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: t("loans.selectBorrower") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex rounded-xl bg-slate-100 p-1 gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => {
          setBorrowerMode("search");
          setSelectedBorrower(null);
          setBorrowerQuery("");
          setCreatedBorrowerId(null);
        }, className: `flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${borrowerMode === "search" ? "bg-white text-violet-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`, children: t("loans.searchExisting") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => {
          setBorrowerMode("create");
          setSelectedBorrower(null);
          setNewBorrowerErrors({});
        }, className: `flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${borrowerMode === "create" ? "bg-white text-violet-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`, children: [
          "+ ",
          t("loans.newBorrower")
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 space-y-3", children: [
        borrowerMode === "search" ? selectedBorrower ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-slate-900", children: /* @__PURE__ */ jsxRuntimeExports.jsx(NameDisplay, { name: selectedBorrower.name }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-500", children: selectedBorrower.mobile })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: () => {
            setSelectedBorrower(null);
            setBorrowerQuery("");
          }, children: t("common.edit") })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: t("common.search"), value: borrowerQuery, onChange: (e) => handleBorrowerSearch(e.target.value) }),
          borrowerResults.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "rounded-lg border border-slate-200 divide-y divide-slate-100 max-h-48 overflow-y-auto", children: borrowerResults.map((b) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "w-full text-left px-3 py-2.5 hover:bg-slate-50 min-h-[44px]", onClick: () => {
            setSelectedBorrower(b);
            setBorrowerResults([]);
            setBorrowerQuery(b.name);
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: /* @__PURE__ */ jsxRuntimeExports.jsx(NameDisplay, { name: b.name }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-slate-400", children: [
              b.mobile,
              b.area ? ` — ${b.area}` : ""
            ] })
          ] }) }, b.id)) })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { label: t("borrowers.name"), value: newBorrower.name, onChange: (e) => {
            setNewBorrower((p) => ({
              ...p,
              name: e.target.value
            }));
            setNewBorrowerErrors((p) => ({
              ...p,
              name: ""
            }));
          }, error: newBorrowerErrors.name, placeholder: "Full name" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { label: t("borrowers.mobile"), value: newBorrower.mobile, onChange: (e) => {
            setNewBorrower((p) => ({
              ...p,
              mobile: e.target.value.replace(/\D/g, "").slice(0, 10)
            }));
            setNewBorrowerErrors((p) => ({
              ...p,
              mobile: ""
            }));
          }, error: newBorrowerErrors.mobile, inputMode: "numeric", placeholder: "10-digit mobile" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { label: t("borrowers.area"), value: newBorrower.area, onChange: (e) => setNewBorrower((p) => ({
            ...p,
            area: e.target.value
          })), placeholder: t("common.optional") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { label: t("borrowers.address"), value: newBorrower.address, onChange: (e) => setNewBorrower((p) => ({
            ...p,
            address: e.target.value
          })), placeholder: t("common.optional") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400", children: t("loans.photosLaterHint") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "w-full", onClick: handleStep1Next, disabled: borrowerMode === "search" && !selectedBorrower || creatingBorrower, loading: creatingBorrower, children: t("common.next") })
      ] })
    ] }),
    step === "amount" && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: t("loans.enterAmount") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400 mt-1 mb-3", children: t("loans.autoCalcHint") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { label: t("loans.primaryAmount"), value: primaryAmount, onChange: (e) => setPrimaryAmount(e.target.value.replace(/[^\d]/g, "")), inputMode: "numeric", lang: "en", leftIcon: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-500 text-sm", children: "₹" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: t("loans.tenure") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", size: "sm", onClick: () => setTenureMonths((t2) => Math.max(1, t2 - 1)), disabled: tenureMonths <= 1, children: "-" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg font-semibold text-slate-900 min-w-[3ch] text-center", children: tenureMonths }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", size: "sm", onClick: () => setTenureMonths((t2) => Math.min(60, t2 + 1)), disabled: tenureMonths >= 60, children: "+" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-slate-500", children: t("loans.months") })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Select, { label: t("loans.frequency"), value: frequency, onChange: (e) => setFrequency(e.target.value), options: [{
          value: "monthly",
          label: t("loans.monthly")
        }, {
          value: "weekly",
          label: t("loans.weekly")
        }] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { label: t("loans.dateGiven"), value: dateGiven, onChange: (e) => setDateGiven(e.target.value) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AutoCalcPreview, { calc }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => setStep("borrower"), className: "flex-1", children: t("common.back") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => setStep("schedule"), disabled: !calc, className: "flex-1", children: t("common.next") })
        ] })
      ] })
    ] }),
    step === "schedule" && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: t("loans.reviewSchedule") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 space-y-2 max-h-64 overflow-y-auto", children: schedule.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-slate-600", children: [
          "#",
          s.installmentNumber
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DateDisplay, { date: s.dueDate, className: "text-slate-500" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: s.amountDue, className: "font-medium text-slate-900" })
      ] }, s.installmentNumber)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 mt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => setStep("amount"), className: "flex-1", children: t("common.back") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => setStep("confirm"), className: "flex-1", children: t("common.next") })
      ] })
    ] }),
    step === "confirm" && calc && selectedBorrower && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: t("loans.confirmCreate") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-slate-50 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-500", children: t("borrowers.name") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: /* @__PURE__ */ jsxRuntimeExports.jsx(NameDisplay, { name: selectedBorrower.name }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AutoCalcPreview, { calc }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-slate-50 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-500", children: t("loans.dateGiven") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DateDisplay, { date: dateGiven, className: "font-medium" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: () => setStep("schedule"), className: "flex-1", children: t("common.back") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSubmit, loading, className: "flex-1", children: t("loans.confirmCreate") })
        ] })
      ] })
    ] })
  ] });
}
export {
  NewLoanPage as component
};
