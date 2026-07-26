import { r as reactExports, j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { L as Link } from "../_chunks/_libs/@tanstack/react-router.mjs";
import { g as getLoanById, u as updateLoan, a as changeStatus, e as extendTenure } from "./loans-DdW0j3QS.mjs";
import { o as Route$2, B as Button, t as toast, e as createSsrRpc } from "./router-BkdMoR6V.mjs";
import { c as createServerFn } from "./index.mjs";
import { C as Card, a as CardTitle } from "./Card-BGH86XgU.mjs";
import { B as Badge } from "./Badge-BExCBNfX.mjs";
import { P as PageSkeleton } from "./PageSkeleton-CL8u5l4B.mjs";
import { C as CurrencyDisplay } from "./CurrencyDisplay-DxtEIDNl.mjs";
import { D as DateDisplay } from "./DateDisplay-B5D35cED.mjs";
import { u as useLocalizedName } from "./NameDisplay-BEn732AH.mjs";
import { B as BorrowerAvatar } from "./BorrowerAvatar-C75IJ0wD.mjs";
import { P as PaymentTimeline } from "./PaymentTimeline-BxUyWgI1.mjs";
import { P as PaymentMarkModal } from "./PaymentMarkModal-BEwoHZ6F.mjs";
import { I as Input } from "./Input-DxOP6u0W.mjs";
import { g as formatPhone } from "./formatters-khdU1uWq.mjs";
import { c as clsx } from "../_libs/clsx.mjs";
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
import "../_chunks/_libs/@tanstack/store.mjs";
import "../_chunks/_libs/@tanstack/react-store.mjs";
import "../_libs/use-sync-external-store.mjs";
import "../_libs/i18next.mjs";
import "./auth-CwIywibs.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "./Select-tn0N3Klx.mjs";
import "./DatePicker-Doyp9g9q.mjs";
import "./payments-za2vx1po.mjs";
import "./payment-jMyh0Ybg.mjs";
const sendLoanWhatsAppTemplate = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const loanId = data.loanId;
  if (!loanId) throw new Error("Loan ID is required");
  return {
    loanId
  };
}).handler(createSsrRpc("2f15cf97c55a997040ea638dacd5e036f9ef72c63417c6b0124d32db95c057d7"));
function ExtendTenureModal({ loan, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [newTenure, setNewTenure] = reactExports.useState("");
  const [loading, setLoading] = reactExports.useState(false);
  const paidAmount = loan.payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + parseFloat(p.amountPaid), 0);
  const remainingAmount = parseFloat(loan.totalRepayment) - paidAmount;
  const newTenureNum = parseInt(newTenure) || 0;
  const newTotalInstallments = loan.paymentFrequency === "monthly" ? newTenureNum : newTenureNum * 4;
  const paidInstallments = loan.payments.filter((p) => p.status === "paid").length;
  const newRemainingInstallments = newTotalInstallments - paidInstallments;
  const newInstallmentAmount = newRemainingInstallments > 0 ? remainingAmount / newRemainingInstallments : 0;
  const isValid = newTenureNum > loan.tenureMonths && newRemainingInstallments > 0;
  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      await extendTenure({ data: { id: loan.id, newTenureMonths: newTenureNum } });
      toast("Tenure extended successfully", "success");
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
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-slate-900", children: t("loans.extendTenure") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: onClose,
            className: "min-h-11 min-w-11 flex items-center justify-center text-slate-400 hover:text-slate-600",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-5 w-5", viewBox: "0 0 20 20", fill: "currentColor", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { fillRule: "evenodd", d: "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z", clipRule: "evenodd" }) })
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-slate-50 p-3 space-y-1.5 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-500", children: "Current tenure" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium text-slate-900", children: [
              loan.tenureMonths,
              " months"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-500", children: "Installments paid" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium text-slate-900", children: [
              paidInstallments,
              " / ",
              loan.totalInstallments
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-500", children: "Remaining balance" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: remainingAmount, className: "font-semibold text-slate-900" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            label: t("loans.newTenure"),
            value: newTenure,
            onChange: (e) => setNewTenure(e.target.value.replace(/\D/g, "")),
            inputMode: "numeric",
            placeholder: `More than ${loan.tenureMonths} months`
          }
        ),
        newTenureNum > loan.tenureMonths && newRemainingInstallments > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-primary/5 border border-primary/20 p-3 space-y-1.5 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-primary uppercase tracking-wide", children: "New schedule preview" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-500", children: "New installment amount" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: newInstallmentAmount, className: "font-bold text-slate-900" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-500", children: "Remaining installments" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-slate-900", children: newRemainingInstallments })
          ] })
        ] }),
        newTenureNum > 0 && newTenureNum <= loan.tenureMonths && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-red-500", children: [
          "New tenure must be longer than current (",
          loan.tenureMonths,
          " months)"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 pt-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "w-full", onClick: handleSubmit, loading, disabled: !isValid || loading, children: [
            "Extend to ",
            newTenureNum > 0 ? `${newTenureNum} months` : "..."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", className: "w-full", onClick: onClose, disabled: loading, children: t("common.cancel") })
        ] })
      ] })
    ] })
  ] });
}
function LoanDetailPage() {
  const {
    loanId
  } = Route$2.useParams();
  const {
    t
  } = useTranslation();
  const [loan, setLoan] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [selectedPayment, setSelectedPayment] = reactExports.useState(null);
  const [showExtendModal, setShowExtendModal] = reactExports.useState(false);
  const [menuOpen, setMenuOpen] = reactExports.useState(false);
  const [confirmDefaulted, setConfirmDefaulted] = reactExports.useState(false);
  const [confirmActive, setConfirmActive] = reactExports.useState(false);
  const [statusChanging, setStatusChanging] = reactExports.useState(false);
  const [editingNotes, setEditingNotes] = reactExports.useState(false);
  const [notesValue, setNotesValue] = reactExports.useState("");
  const [notesSaving, setNotesSaving] = reactExports.useState(false);
  const [whatsAppSending, setWhatsAppSending] = reactExports.useState(false);
  const menuRef = reactExports.useRef(null);
  const borrowerDisplayName = useLocalizedName(loan?.borrower?.name ?? "");
  const fetchLoan = reactExports.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLoanById({
        data: {
          id: loanId
        }
      });
      setLoan(data);
      setNotesValue(data.notes ?? "");
    } catch {
    } finally {
      setLoading(false);
    }
  }, [loanId]);
  reactExports.useEffect(() => {
    fetchLoan();
  }, [fetchLoan]);
  reactExports.useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);
  const handleStatusChange = async (newStatus) => {
    setStatusChanging(true);
    setConfirmDefaulted(false);
    setConfirmActive(false);
    try {
      await changeStatus({
        data: {
          id: loanId,
          status: newStatus
        }
      });
      toast(t("loans.changeStatusSuccess"), "success");
      await fetchLoan();
    } catch (err) {
      toast(err instanceof Error ? err.message : t("errors.generic"), "error");
    } finally {
      setStatusChanging(false);
    }
  };
  const handleSaveNotes = async () => {
    setNotesSaving(true);
    try {
      await updateLoan({
        data: {
          id: loanId,
          notes: notesValue
        }
      });
      toast("Notes saved", "success");
      setEditingNotes(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : t("errors.generic"), "error");
    } finally {
      setNotesSaving(false);
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(PageSkeleton, { variant: "detail" });
  }
  if (!loan) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center text-slate-500 py-12", children: t("errors.notFound") });
  }
  const paidCount = loan.payments.filter((p) => p.status === "paid").length;
  const pendingCount = loan.payments.filter((p) => p.status === "pending" || p.status === "partial").length;
  const overdueCount = loan.payments.filter((p) => p.status === "overdue").length;
  const totalPaid = loan.payments.filter((p) => p.status === "paid" || p.status === "partial").reduce((sum, p) => sum + parseFloat(p.amountPaid), 0);
  const outstanding = parseFloat(loan.totalRepayment) - totalPaid;
  const progress = parseFloat(loan.totalRepayment) > 0 ? totalPaid / parseFloat(loan.totalRepayment) * 100 : 0;
  const isValidIndianMobile = /^[6-9]\d{9}$/.test(loan.borrower.mobile);
  const handleWhatsAppReminder = async () => {
    if (!isValidIndianMobile) return;
    setWhatsAppSending(true);
    try {
      await sendLoanWhatsAppTemplate({
        data: {
          loanId
        }
      });
      toast(t("loans.whatsappReminderSent"), "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : t("errors.generic"), "error");
    } finally {
      setWhatsAppSending(false);
    }
  };
  const canDefault = loan.status === "active" || loan.status === "extended";
  const canRevertActive = loan.status === "defaulted";
  const canExtend = loan.status === "active" || loan.status === "extended";
  const paidInstallmentsForModal = loan.payments.filter((p) => p.status === "paid").length;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mx-auto space-y-4 pb-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/loans", className: "text-slate-400 hover:text-slate-600 shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M15 19l-7-7 7-7" }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex items-center gap-2 min-w-0 flex-wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold text-slate-900 shrink-0", children: t("loans.loanDetails") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-slate-400 font-bold tabular-nums shrink-0", children: [
          "#",
          loan.loanNumber
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { status: loan.status, children: t(`loans.status${loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}`) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative shrink-0", ref: menuRef, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setMenuOpen((o) => !o), className: "min-h-11 min-w-11 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors", "aria-label": "Actions", children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-5 w-5", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" }) }) }),
        menuOpen && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute right-0 top-12 z-20 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ActionMenuItem, { label: t("loans.editNotes"), icon: "✏️", onClick: () => {
            setEditingNotes(true);
            setMenuOpen(false);
          } }),
          canExtend && /* @__PURE__ */ jsxRuntimeExports.jsx(ActionMenuItem, { label: t("loans.extendTenure"), icon: "📅", onClick: () => {
            setShowExtendModal(true);
            setMenuOpen(false);
          } }),
          canDefault && /* @__PURE__ */ jsxRuntimeExports.jsx(ActionMenuItem, { label: t("loans.markDefaulted"), icon: "⚠️", danger: true, onClick: () => {
            setConfirmDefaulted(true);
            setMenuOpen(false);
          } }),
          canRevertActive && /* @__PURE__ */ jsxRuntimeExports.jsx(ActionMenuItem, { label: t("loans.revertActive"), icon: "↩️", onClick: () => {
            setConfirmActive(true);
            setMenuOpen(false);
          } })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/borrowers/$borrowerId", params: {
        borrowerId: loan.borrower.id
      }, className: "flex items-center gap-3 hover:opacity-80 transition-opacity", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(BorrowerAvatar, { name: loan.borrower.name, photoUrl: loan.borrower.profilePhotoUrl, size: "md" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-slate-900", children: borrowerDisplayName }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-500", children: formatPhone(loan.borrower.mobile) }),
          loan.borrower.area && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400", children: loan.borrower.area })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-4 w-4 text-slate-300 shrink-0", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 5l7 7-7 7" }) })
      ] }),
      isValidIndianMobile && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", size: "sm", className: "mt-3 w-full", onClick: handleWhatsAppReminder, loading: whatsAppSending, disabled: whatsAppSending, children: t("loans.sendWhatsAppReminder") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "mb-3", children: t("loans.overviewTitle") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(OverviewTile, { label: t("loans.primaryAmount"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: parseFloat(loan.primaryAmount), className: "font-bold text-slate-900" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(OverviewTile, { label: t("loans.amountReceived"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: parseFloat(loan.amountUserReceived), className: "font-bold text-slate-900" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(OverviewTile, { label: t("loans.totalRepayment"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: parseFloat(loan.totalRepayment), className: "font-bold text-slate-900" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(OverviewTile, { label: t("loans.profit"), accent: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: parseFloat(loan.profitAmount), className: "font-bold text-emerald-600" }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "mb-3", children: t("loans.repaymentProgress") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: t("loans.totalPaid") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: totalPaid, className: "text-lg font-bold text-slate-900" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-3xl font-extrabold text-slate-900", children: [
          Math.round(progress),
          "%"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: t("loans.outstanding") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: Math.max(0, outstanding), className: clsx("text-lg font-bold", outstanding > 0 ? "text-amber-600" : "text-emerald-600") })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 rounded-full bg-slate-100 overflow-hidden mb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: clsx("h-full rounded-full transition-all", loan.status === "completed" ? "bg-emerald-500" : loan.status === "defaulted" ? "bg-red-400" : "bg-primary"), style: {
        width: `${progress}%`
      } }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-slate-500 text-center", children: [
        paidCount,
        " of ",
        loan.totalInstallments,
        " installments ·",
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: parseFloat(loan.installmentAmount), className: "inline" }),
        loan.paymentFrequency === "monthly" ? `/${t("loans.perMonth")}` : `/${t("loans.perWeek")}`
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-x-4 gap-y-3 text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(InfoRow, { label: t("loans.dateGiven"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(DateDisplay, { date: loan.dateGiven, className: "font-medium text-slate-900" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(InfoRow, { label: t("loans.startMonth"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(DateDisplay, { date: loan.startMonth, className: "font-medium text-slate-900" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(InfoRow, { label: t("loans.tenure"), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium text-slate-900", children: [
        loan.tenureMonths,
        " ",
        t("loans.months")
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(InfoRow, { label: t("loans.frequency"), children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-slate-900", children: loan.paymentFrequency === "monthly" ? t("loans.monthly") : t("loans.weekly") }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(InfoRow, { label: t("loans.serviceCharge"), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium text-slate-900", children: [
        loan.serviceChargePercent,
        "%"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(InfoRow, { label: "Markup", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium text-slate-900", children: [
        loan.markupPercent,
        "%"
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: t("payments.title") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 flex-wrap justify-end", children: [
          paidCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold", children: [
            paidCount,
            " paid"
          ] }),
          pendingCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold", children: [
            pendingCount,
            " pending"
          ] }),
          overdueCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-semibold", children: [
            overdueCount,
            " overdue"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentTimeline, { payments: loan.payments, onPaymentTap: (payment) => setSelectedPayment(payment) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: t("common.notes") }),
        !editingNotes && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setEditingNotes(true), className: "text-xs text-primary font-medium hover:underline", children: t("loans.editNotes") })
      ] }),
      editingNotes ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { value: notesValue, onChange: (e) => setNotesValue(e.target.value), rows: 3, className: "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors", placeholder: t("loans.notesPlaceholder"), autoFocus: true }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", onClick: handleSaveNotes, loading: notesSaving, disabled: notesSaving, children: t("loans.saveNotes") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => {
            setEditingNotes(false);
            setNotesValue(loan.notes ?? "");
          }, disabled: notesSaving, children: t("common.cancel") })
        ] })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-600 whitespace-pre-wrap min-h-[2rem]", children: loan.notes ? loan.notes : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 italic", children: t("loans.notesPlaceholder") }) })
    ] }),
    selectedPayment && /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentMarkModal, { payment: selectedPayment, onClose: () => setSelectedPayment(null), onSuccess: () => {
      setSelectedPayment(null);
      fetchLoan();
    } }),
    showExtendModal && /* @__PURE__ */ jsxRuntimeExports.jsx(ExtendTenureModal, { loan: {
      id: loan.id,
      tenureMonths: loan.tenureMonths,
      totalInstallments: loan.totalInstallments,
      paidInstallments: paidInstallmentsForModal,
      installmentAmount: loan.installmentAmount,
      totalRepayment: loan.totalRepayment,
      paymentFrequency: loan.paymentFrequency,
      payments: loan.payments.map((p) => ({
        status: p.status,
        amountPaid: p.amountPaid
      }))
    }, onClose: () => setShowExtendModal(false), onSuccess: () => {
      setShowExtendModal(false);
      fetchLoan();
    } }),
    confirmDefaulted && /* @__PURE__ */ jsxRuntimeExports.jsx(ConfirmModal, { title: t("loans.markDefaulted"), message: t("loans.confirmDefault"), confirmLabel: t("loans.markDefaulted"), danger: true, loading: statusChanging, onConfirm: () => handleStatusChange("defaulted"), onCancel: () => setConfirmDefaulted(false) }),
    confirmActive && /* @__PURE__ */ jsxRuntimeExports.jsx(ConfirmModal, { title: t("loans.revertActive"), message: t("loans.confirmRevertActive"), confirmLabel: t("loans.revertActive"), loading: statusChanging, onConfirm: () => handleStatusChange("active"), onCancel: () => setConfirmActive(false) })
  ] });
}
function OverviewTile({
  label,
  children,
  accent = false
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: clsx("rounded-xl p-3", accent ? "bg-emerald-50" : "bg-slate-50"), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500 mb-0.5", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm", children })
  ] });
}
function InfoRow({
  label,
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500 mb-0.5", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm", children })
  ] });
}
function ActionMenuItem({
  label,
  icon,
  danger = false,
  onClick
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick, className: clsx("w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors", danger ? "text-red-600 hover:bg-red-50" : "text-slate-700 hover:bg-slate-50"), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: icon }),
    label
  ] });
}
function ConfirmModal({
  title,
  message,
  confirmLabel,
  danger = false,
  loading,
  onConfirm,
  onCancel
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center px-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-black/40", onClick: onCancel }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative bg-white rounded-2xl w-full max-w-sm shadow-xl p-5 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-bold text-slate-900", children: title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-600", children: message }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", className: "flex-1", onClick: onCancel, disabled: loading, children: "Cancel" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: danger ? "danger" : "primary", className: "flex-1", onClick: onConfirm, loading, disabled: loading, children: confirmLabel })
      ] })
    ] })
  ] });
}
export {
  LoanDetailPage as component
};
