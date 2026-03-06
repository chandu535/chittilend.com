import { r as reactExports, j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { B as Button, t as toast } from "./router-CLGnVP9u.mjs";
import { I as Input } from "./Input-CQaLwuWI.mjs";
import { S as Select } from "./Select-tn0N3Klx.mjs";
import { D as DatePicker } from "./DatePicker-Doyp9g9q.mjs";
import { C as CurrencyDisplay } from "./CurrencyDisplay-CUrYCypM.mjs";
import { D as DateDisplay } from "./DateDisplay-Bp4CaYMe.mjs";
import { B as Badge } from "./Badge-_eeoowG6.mjs";
import { m as markPaymentWaived, d as markPaymentPaid, e as markPaymentPartial } from "./payments-CPiiD66f.mjs";
import { u as useTranslation } from "../_libs/react-i18next.mjs";
function PaymentMarkModal({ payment, onClose, onSuccess }) {
  const { t } = useTranslation();
  const amountDue = parseFloat(payment.amountDue);
  const alreadyPaid = parseFloat(payment.amountPaid);
  const [amountPaid, setAmountPaid] = reactExports.useState(
    payment.status === "partial" ? (amountDue - alreadyPaid).toFixed(0) : amountDue.toFixed(0)
  );
  const [paidDate, setPaidDate] = reactExports.useState((/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = reactExports.useState("cash");
  const [notes, setNotes] = reactExports.useState("");
  const [loading, setLoading] = reactExports.useState(null);
  const handleAction = async (action) => {
    setLoading(action);
    try {
      if (action === "waived") {
        if (!notes.trim()) {
          toast(t("payments.waiverReason"), "error");
          setLoading(null);
          return;
        }
        await markPaymentWaived({ data: { paymentId: payment.id, notes } });
      } else {
        const amount = parseFloat(amountPaid);
        if (!amount || amount <= 0) {
          toast(t("common.required"), "error");
          setLoading(null);
          return;
        }
        const fn = action === "paid" ? markPaymentPaid : markPaymentPartial;
        await fn({
          data: {
            paymentId: payment.id,
            amountPaid: amount,
            paidDate,
            paymentMethod,
            notes: notes || void 0
          }
        });
      }
      toast(t("payments.confirmPayment"), "success");
      onSuccess();
    } catch (err) {
      toast(err instanceof Error ? err.message : t("errors.generic"), "error");
    } finally {
      setLoading(null);
    }
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
          payment.status === "partial" && alreadyPaid > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-slate-500", children: t("payments.amountPaid") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: alreadyPaid, className: "text-sm font-medium text-amber-600" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-slate-500", children: t("common.status") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { status: payment.status, children: t(`payments.${payment.status}`) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            label: t("payments.amountPaid"),
            value: amountPaid,
            onChange: (e) => setAmountPaid(e.target.value.replace(/[^\d.]/g, "")),
            inputMode: "decimal",
            lang: "en",
            leftIcon: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-500 text-sm", children: "₹" })
          }
        ),
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
              onClick: () => handleAction("paid"),
              loading: loading === "paid",
              disabled: loading !== null,
              children: t("payments.markPaid")
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "secondary",
              className: "w-full",
              onClick: () => handleAction("partial"),
              loading: loading === "partial",
              disabled: loading !== null,
              children: t("payments.markPartial")
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "ghost",
              className: "w-full text-purple-700 hover:bg-purple-50",
              onClick: () => handleAction("waived"),
              loading: loading === "waived",
              disabled: loading !== null,
              children: t("payments.markWaived")
            }
          )
        ] })
      ] })
    ] })
  ] });
}
export {
  PaymentMarkModal as P
};
