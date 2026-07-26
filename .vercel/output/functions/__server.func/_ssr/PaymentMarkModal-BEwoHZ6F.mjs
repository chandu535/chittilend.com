import { r as reactExports, j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { B as Button, t as toast } from "./router-BkdMoR6V.mjs";
import { I as Input } from "./Input-DxOP6u0W.mjs";
import { S as Select } from "./Select-tn0N3Klx.mjs";
import { D as DatePicker } from "./DatePicker-Doyp9g9q.mjs";
import { C as CurrencyDisplay } from "./CurrencyDisplay-DxtEIDNl.mjs";
import { D as DateDisplay } from "./DateDisplay-B5D35cED.mjs";
import { B as Badge } from "./Badge-BExCBNfX.mjs";
import { r as revertPayment, m as markPaymentPaid, d as markPaymentWaived } from "./payments-za2vx1po.mjs";
import { u as useTranslation } from "../_libs/react-i18next.mjs";
function PaymentMarkModal({ payment, onClose, onSuccess }) {
  const { t } = useTranslation();
  const amountDue = parseFloat(payment.amountDue);
  const alreadyPaid = parseFloat(payment.amountPaid);
  const remainingToPay = amountDue - alreadyPaid;
  const isCompleted = payment.status === "paid" || payment.status === "waived";
  const [amountNow, setAmountNow] = reactExports.useState(remainingToPay.toFixed(2));
  const [partialMode, setPartialMode] = reactExports.useState(false);
  const [paidDate, setPaidDate] = reactExports.useState((/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = reactExports.useState("cash");
  const [notes, setNotes] = reactExports.useState("");
  const [revertReason, setRevertReason] = reactExports.useState("");
  const [loading, setLoading] = reactExports.useState(null);
  const totalAfterPayment = alreadyPaid + parseFloat(amountNow || "0");
  const willBeFullyPaid = totalAfterPayment >= amountDue;
  const handleSubmit = async () => {
    const amount = parseFloat(amountNow);
    if (!amount || amount <= 0) {
      toast(t("common.required"), "error");
      return;
    }
    setLoading("submit");
    try {
      await markPaymentPaid({
        data: {
          paymentId: payment.id,
          amountPaid: totalAfterPayment,
          paidDate,
          paymentMethod,
          notes: notes || void 0
        }
      });
      toast(t("payments.confirmPayment"), "success");
      onSuccess();
    } catch (err) {
      toast(err instanceof Error ? err.message : t("errors.generic"), "error");
    } finally {
      setLoading(null);
    }
  };
  const handleWaive = async () => {
    if (!notes.trim()) {
      toast(t("payments.waiverReason"), "error");
      return;
    }
    setLoading("waived");
    try {
      await markPaymentWaived({ data: { paymentId: payment.id, notes } });
      toast(t("payments.confirmPayment"), "success");
      onSuccess();
    } catch (err) {
      toast(err instanceof Error ? err.message : t("errors.generic"), "error");
    } finally {
      setLoading(null);
    }
  };
  const handleRevert = async () => {
    setLoading("revert");
    try {
      await revertPayment({
        data: {
          paymentId: payment.id,
          reason: revertReason || void 0
        }
      });
      toast(t("payments.revertSuccess"), "success");
      onSuccess();
    } catch (err) {
      const message = err instanceof Error && err.message.includes("PAYMENT_ALREADY_PENDING") ? t("payments.alreadyPending") : err instanceof Error ? err.message : t("errors.generic");
      toast(message, "error");
    } finally {
      setLoading(null);
    }
  };
  const togglePartialMode = () => {
    if (partialMode) {
      setAmountNow(remainingToPay.toFixed(2));
    }
    setPartialMode((m) => !m);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed inset-0 z-50 flex items-end sm:items-center justify-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-black/40", onClick: onClose }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto shadow-xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sticky top-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between rounded-t-2xl", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-slate-900", children: t("payments.installmentNo", { number: payment.installmentNumber }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: onClose,
            className: "min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-5 w-5", viewBox: "0 0 20 20", fill: "currentColor", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "path",
              {
                fillRule: "evenodd",
                d: "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z",
                clipRule: "evenodd"
              }
            ) })
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-slate-50 p-3 space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-slate-500", children: t("payments.dueDate") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DateDisplay, { date: payment.dueDate, className: "text-sm font-medium text-slate-900" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-slate-500", children: t("payments.amountDue") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: amountDue, className: "text-lg font-bold text-slate-900" })
          ] }),
          alreadyPaid > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-slate-500", children: t("payments.amountPaid") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: alreadyPaid, className: "text-sm font-medium text-amber-600" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-slate-500", children: t("common.status") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { status: payment.status, children: t(`payments.${payment.status}`) })
          ] })
        ] }),
        isCompleted ? (
          /* ---- Revert View ---- */
          /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-amber-200 bg-amber-50 p-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-amber-800", children: t("payments.revertConfirm") }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: t("payments.revertReason") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "textarea",
                {
                  value: revertReason,
                  onChange: (e) => setRevertReason(e.target.value),
                  rows: 2,
                  className: "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors",
                  placeholder: t("payments.revertReason")
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 pt-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "danger",
                  className: "w-full",
                  onClick: handleRevert,
                  loading: loading === "revert",
                  disabled: loading !== null,
                  children: t("payments.revertPayment")
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", className: "w-full", onClick: onClose, disabled: loading !== null, children: t("common.cancel") })
            ] })
          ] })
        ) : (
          /* ---- Mark Payment View ---- */
          /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  label: t("payments.amountPaid"),
                  value: amountNow,
                  onChange: (e) => setAmountNow(e.target.value.replace(/[^0-9.]/g, "")),
                  inputMode: "decimal",
                  lang: "en",
                  leftIcon: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-500 text-sm", children: "₹" }),
                  disabled: !partialMode
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: togglePartialMode,
                  className: "mt-1.5 text-xs text-primary font-medium hover:underline",
                  children: partialMode ? t("payments.payFullAmount") : t("payments.payDifferentAmount")
                }
              )
            ] }),
            partialMode && !willBeFullyPaid && totalAfterPayment > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-amber-700", children: t("payments.remainingAmount") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                CurrencyDisplay,
                {
                  amount: amountDue - totalAfterPayment,
                  className: "text-sm font-bold text-amber-700"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              DatePicker,
              {
                label: t("payments.paidDate"),
                value: paidDate,
                onChange: (e) => setPaidDate(e.target.value)
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Select,
              {
                label: t("payments.paymentMethod"),
                value: paymentMethod,
                onChange: (e) => setPaymentMethod(e.target.value),
                options: [
                  { value: "cash", label: t("payments.cash") },
                  { value: "upi", label: t("payments.upi") },
                  { value: "bank_transfer", label: t("payments.bankTransfer") },
                  { value: "other", label: t("payments.other") }
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: t("common.notes") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "textarea",
                {
                  value: notes,
                  onChange: (e) => setNotes(e.target.value),
                  rows: 2,
                  className: "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors",
                  placeholder: t("common.notes")
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 pt-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  className: "w-full",
                  onClick: handleSubmit,
                  loading: loading === "submit",
                  disabled: loading !== null,
                  children: willBeFullyPaid ? t("payments.markPaid") : t("payments.markPartial")
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "ghost",
                  className: "w-full text-purple-700 hover:bg-purple-50",
                  onClick: handleWaive,
                  loading: loading === "waived",
                  disabled: loading !== null,
                  children: t("payments.markWaived")
                }
              )
            ] })
          ] })
        )
      ] })
    ] })
  ] });
}
export {
  PaymentMarkModal as P
};
