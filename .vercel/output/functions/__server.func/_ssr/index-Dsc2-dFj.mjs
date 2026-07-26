import { r as reactExports, j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { L as Link } from "../_chunks/_libs/@tanstack/react-router.mjs";
import { l as listAreas, a as listBorrowers } from "./borrowers-DZZMFZOE.mjs";
import { B as Button } from "./router-BkdMoR6V.mjs";
import { I as Input } from "./Input-DxOP6u0W.mjs";
import { S as Select } from "./Select-tn0N3Klx.mjs";
import { g as formatPhone } from "./formatters-khdU1uWq.mjs";
import { N as NameDisplay, u as useLocalizedName } from "./NameDisplay-BEn732AH.mjs";
import { B as BorrowerAvatar } from "./BorrowerAvatar-C75IJ0wD.mjs";
import { E as EmptyState } from "./EmptyState-CP7HaiDi.mjs";
import { P as PageSkeleton } from "./PageSkeleton-CL8u5l4B.mjs";
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
import "./borrower-Bf161yIl.mjs";
import "../_libs/joi.mjs";
import "../_chunks/_libs/@hapi/hoek.mjs";
import "../_chunks/_libs/@hapi/formula.mjs";
import "../_chunks/_libs/@hapi/pinpoint.mjs";
import "../_chunks/_libs/@hapi/topo.mjs";
import "../_chunks/_libs/@hapi/address.mjs";
import "url";
import "../_chunks/_libs/@hapi/tlds.mjs";
import "./constants-CT9Kuti2.mjs";
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
function BorrowerCard({ id, name, mobile, area, photoUrl, loanCount }) {
  const { t } = useTranslation();
  const displayName = useLocalizedName(name);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Link,
    {
      to: "/borrowers/$borrowerId",
      params: { borrowerId: id },
      className: "block rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(BorrowerAvatar, { name, photoUrl, size: "md" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-slate-900 truncate", children: displayName }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-500", children: formatPhone(mobile) })
          ] }),
          area && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-slate-400 bg-slate-50 rounded-full px-2 py-0.5 shrink-0", children: area })
        ] }),
        loanCount !== void 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500", children: [
          t("borrowers.activeLoans"),
          ": ",
          loanCount
        ] })
      ]
    }
  );
}
function BorrowersPage() {
  const {
    t
  } = useTranslation();
  const [search, setSearch] = reactExports.useState("");
  const [area, setArea] = reactExports.useState("all");
  const [page, setPage] = reactExports.useState(1);
  const [limit] = reactExports.useState(25);
  const [loading, setLoading] = reactExports.useState(true);
  const [areas, setAreas] = reactExports.useState([]);
  const [result, setResult] = reactExports.useState({
    items: [],
    total: 0,
    totalPages: 0
  });
  const fetchBorrowers = async () => {
    setLoading(true);
    try {
      const data = await listBorrowers({
        data: {
          page,
          limit,
          area,
          search
        }
      });
      setResult(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };
  const fetchAreas = async () => {
    try {
      const data = await listAreas();
      setAreas(data);
    } catch {
    }
  };
  reactExports.useEffect(() => {
    fetchAreas();
  }, []);
  reactExports.useEffect(() => {
    fetchBorrowers();
  }, [page, area]);
  reactExports.useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchBorrowers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-slate-900", children: t("borrowers.title") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/borrowers/new", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", children: t("borrowers.newBorrower") }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: t("common.search"), value: search, onChange: (e) => setSearch(e.target.value), leftIcon: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }) }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Select, { value: area, onChange: (e) => {
        setArea(e.target.value);
        setPage(1);
      }, options: [{
        value: "all",
        label: t("common.all")
      }, ...areas.map((a) => ({
        value: a,
        label: a
      }))] })
    ] }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(PageSkeleton, { variant: "table" }) : result.items.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { title: t("borrowers.noBorrowers"), action: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/borrowers/new", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { children: t("borrowers.newBorrower") }) }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sm:hidden space-y-3", children: result.items.map((b) => /* @__PURE__ */ jsxRuntimeExports.jsx(BorrowerCard, { id: b.id, name: b.name, mobile: b.mobile, area: b.area, photoUrl: b.profilePhotoUrl }, b.id)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden sm:block overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-slate-200 text-left text-slate-500", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-3 font-medium", children: t("borrowers.name") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-3 font-medium", children: t("borrowers.mobile") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-3 font-medium", children: t("borrowers.area") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-3 font-medium", children: t("common.actions") })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-slate-100", children: result.items.map((b) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-slate-50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 font-medium text-slate-900", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(BorrowerAvatar, { name: b.name, photoUrl: b.profilePhotoUrl, size: "sm" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(NameDisplay, { name: b.name })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 text-slate-600", children: formatPhone(b.mobile) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 text-slate-600", children: b.area || "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/borrowers/$borrowerId", params: {
            borrowerId: b.id
          }, className: "text-primary hover:underline text-sm", children: t("common.viewAll") }) })
        ] }, b.id)) })
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
  BorrowersPage as component
};
