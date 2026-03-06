import { r as reactExports, j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { L as Link } from "../_chunks/_libs/@tanstack/react-router.mjs";
import { g as getBorrowerById, b as generateNewMagicLink } from "./borrowers-D3qd7hME.mjs";
import { C as Card, a as CardTitle } from "./Card-BK1rG6VK.mjs";
import { B as Badge } from "./Badge-_eeoowG6.mjs";
import { o as Route, B as Button, t as toast } from "./router-CLGnVP9u.mjs";
import { S as Spinner } from "./Spinner-7dxOTM9g.mjs";
import { C as CurrencyDisplay } from "./CurrencyDisplay-CUrYCypM.mjs";
import { u as useLocalizedName } from "./NameDisplay-B5K8GAeS.mjs";
import { d as formatPhone } from "./formatters-khdU1uWq.mjs";
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
import "./borrower-C6HD2kfy.mjs";
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
import "../_libs/clsx.mjs";
import "../_chunks/_libs/@tanstack/store.mjs";
import "../_chunks/_libs/@tanstack/react-store.mjs";
import "../_libs/use-sync-external-store.mjs";
import "../_libs/i18next.mjs";
import "./auth-CwIywibs.mjs";
function MagicLinkGenerator({ borrowerId, portalToken: initialToken }) {
  const { t } = useTranslation();
  const [token, setToken] = reactExports.useState(initialToken);
  const [regenerating, setRegenerating] = reactExports.useState(false);
  const portalUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/portal/${token}`;
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(portalUrl);
      toast(t("borrowers.linkCopied"), "success");
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = portalUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      toast(t("borrowers.linkCopied"), "success");
    }
  };
  const handleRegenerate = async () => {
    if (!confirm(t("common.confirm") + "?")) return;
    setRegenerating(true);
    try {
      const result = await generateNewMagicLink({ data: { id: borrowerId } });
      setToken(result.portalToken);
      toast(t("borrowers.magicLink") + " updated", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : t("errors.generic"), "error");
    } finally {
      setRegenerating(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-slate-700", children: t("borrowers.magicLink") }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          readOnly: true,
          value: portalUrl,
          className: "flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600 truncate min-h-[44px]"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", size: "sm", onClick: handleCopy, children: t("borrowers.copyLink") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Button,
      {
        variant: "ghost",
        size: "sm",
        onClick: handleRegenerate,
        loading: regenerating,
        children: t("borrowers.generateLink")
      }
    )
  ] });
}
function BorrowerDetailPage() {
  const {
    borrowerId
  } = Route.useParams();
  const {
    t
  } = useTranslation();
  const [borrower, setBorrower] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  reactExports.useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await getBorrowerById({
          data: {
            id: borrowerId
          }
        });
        setBorrower(data);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [borrowerId]);
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Spinner, { size: "lg" }) });
  }
  if (!borrower) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center text-slate-500 py-12", children: t("errors.notFound") });
  }
  const displayName = useLocalizedName(borrower.name);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mx-auto space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/borrowers", className: "text-slate-400 hover:text-slate-600", children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M15 19l-7-7 7-7" }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-slate-900", children: displayName })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-semibold shrink-0", children: displayName.charAt(0).toUpperCase() }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0 space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-semibold text-slate-900", children: displayName }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-600", children: formatPhone(borrower.mobile) }),
        borrower.area && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-500", children: borrower.area }),
        borrower.address && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-400", children: borrower.address })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: t("loans.title") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/loans/new", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", children: t("loans.newLoan") }) })
      ] }),
      borrower.loans.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-400", children: t("loans.noLoans") }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: borrower.loans.map((loan) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/loans/$loanId", params: {
        loanId: loan.id
      }, className: "flex items-center justify-between rounded-lg border border-slate-100 p-3 hover:bg-slate-50 transition-colors", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: parseFloat(loan.primaryAmount), className: "font-semibold text-slate-900" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400", children: loan.dateGiven })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { status: loan.status, children: loan.status })
      ] }, loan.id)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(MagicLinkGenerator, { borrowerId: borrower.id, portalToken: borrower.portalToken }) })
  ] });
}
export {
  BorrowerDetailPage as component
};
