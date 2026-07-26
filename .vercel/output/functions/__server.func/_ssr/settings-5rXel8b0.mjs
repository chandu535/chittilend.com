import { r as reactExports, j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { C as Card, a as CardTitle } from "./Card-BGH86XgU.mjs";
import { B as Button, t as toast, e as createSsrRpc } from "./router-BkdMoR6V.mjs";
import { I as Input } from "./Input-DxOP6u0W.mjs";
import { B as Badge } from "./Badge-BExCBNfX.mjs";
import { P as PageSkeleton } from "./PageSkeleton-CL8u5l4B.mjs";
import { E as EmptyState } from "./EmptyState-CP7HaiDi.mjs";
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
import "./constants-CT9Kuti2.mjs";
const listManagers = createServerFn({
  method: "GET"
}).handler(createSsrRpc("4ac19b88fda24680112998290cab23be6b3ca6dbd7a210ce4a0ded515ed2c8ba"));
const createManager = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const input = data;
  if (!input.name || input.name.length < 2) {
    throw new Error("Name must be at least 2 characters");
  }
  if (!input.email || !input.email.includes("@")) {
    throw new Error("Valid email is required");
  }
  if (!input.password || input.password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }
  return input;
}).handler(createSsrRpc("3522d6afa08eb1863225729ae565bc746cf03f7dff76d212cb10a9b18ba28bbd"));
const toggleManagerActive = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const input = data;
  if (!input.managerId) throw new Error("Manager ID is required");
  return input;
}).handler(createSsrRpc("0de027824cdfd2a4d95cdce2b5fe1a4d14143af767c24d1ce2d191f08b910dc0"));
function SettingsPage() {
  const {
    t
  } = useTranslation();
  const [loading, setLoading] = reactExports.useState(true);
  const [managers, setManagers] = reactExports.useState([]);
  const [showAddModal, setShowAddModal] = reactExports.useState(false);
  const fetchManagers = async () => {
    setLoading(true);
    try {
      const result = await listManagers();
      setManagers(result);
    } catch {
    } finally {
      setLoading(false);
    }
  };
  reactExports.useEffect(() => {
    fetchManagers();
  }, []);
  const handleToggle = async (managerId) => {
    try {
      await toggleManagerActive({
        data: {
          managerId
        }
      });
      await fetchManagers();
      toast(t("common.save"), "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : t("errors.generic"), "error");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mx-auto space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-slate-900", children: t("settings.title") }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: t("settings.managers") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", onClick: () => setShowAddModal(true), children: t("settings.addManager") })
      ] }),
      loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(PageSkeleton, { variant: "list" }) : managers.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { title: t("common.noData") }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sm:hidden space-y-2", children: managers.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-slate-100 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-sm text-slate-900", children: m.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { status: m.isActive ? "active" : "defaulted", children: m.isActive ? t("settings.activate") : t("settings.deactivate") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400 mb-2", children: m.email }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: m.isActive ? "danger" : "primary", onClick: () => handleToggle(m.id), className: "w-full", children: m.isActive ? t("settings.deactivate") : t("settings.activate") })
        ] }, m.id)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden sm:block overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-slate-200 text-left text-slate-500", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-3 font-medium", children: t("settings.managerName") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-3 font-medium", children: t("settings.managerEmail") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-3 font-medium", children: t("common.status") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-3 font-medium", children: t("common.actions") })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-slate-100", children: managers.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-slate-50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 font-medium text-slate-900", children: m.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 text-slate-600", children: m.email }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { status: m.isActive ? "active" : "defaulted", children: m.isActive ? t("settings.activate") : t("settings.deactivate") }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: m.isActive ? "danger" : "primary", onClick: () => handleToggle(m.id), children: m.isActive ? t("settings.deactivate") : t("settings.activate") }) })
          ] }, m.id)) })
        ] }) })
      ] })
    ] }),
    showAddModal && /* @__PURE__ */ jsxRuntimeExports.jsx(AddManagerModal, { onClose: () => setShowAddModal(false), onSuccess: () => {
      setShowAddModal(false);
      fetchManagers();
    } })
  ] });
}
function AddManagerModal({
  onClose,
  onSuccess
}) {
  const {
    t
  } = useTranslation();
  const [name, setName] = reactExports.useState("");
  const [email, setEmail] = reactExports.useState("");
  const [password, setPassword] = reactExports.useState("");
  const [loading, setLoading] = reactExports.useState(false);
  const handleSubmit = async () => {
    if (!name || !email || !password) {
      toast(t("common.required"), "error");
      return;
    }
    setLoading(true);
    try {
      await createManager({
        data: {
          name,
          email,
          password
        }
      });
      toast(t("settings.addManager"), "success");
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
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-slate-900", children: t("settings.addManager") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: onClose, className: "min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600", children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-5 w-5", viewBox: "0 0 20 20", fill: "currentColor", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { fillRule: "evenodd", d: "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z", clipRule: "evenodd" }) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { label: t("settings.managerName"), value: name, onChange: (e) => setName(e.target.value), autoFocus: true }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { label: t("settings.managerEmail"), value: email, onChange: (e) => setEmail(e.target.value), type: "email" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { label: t("settings.managerPassword"), value: password, onChange: (e) => setPassword(e.target.value), type: "password", hint: "Min 6 characters" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", onClick: onClose, className: "flex-1", children: t("common.cancel") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSubmit, loading, className: "flex-1", children: t("settings.addManager") })
        ] })
      ] })
    ] })
  ] });
}
export {
  SettingsPage as component
};
