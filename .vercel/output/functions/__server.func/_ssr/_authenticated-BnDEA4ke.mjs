import { r as reactExports, j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { O as Outlet, u as useNavigate, d as useMatchRoute, L as Link } from "../_chunks/_libs/@tanstack/react-router.mjs";
import { u as useStore } from "../_chunks/_libs/@tanstack/react-store.mjs";
import { R as Route$d, s as setAuthUser, a as authStore, b as logout } from "./router-_jeUSzJ6.mjs";
import { u as useLocalizedName } from "./NameDisplay-CsHOu8cU.mjs";
import { L as LanguageToggle } from "./LanguageToggle-DMeQEb2Z.mjs";
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
import "../_libs/use-sync-external-store.mjs";
import "../_chunks/_libs/@tanstack/store.mjs";
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
function Header() {
  const { t } = useTranslation();
  const user = useStore(authStore, (s) => s.user);
  const displayName = useLocalizedName(user?.name || "");
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = reactExports.useState(false);
  const menuRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);
  const handleLogout = async () => {
    await logout();
    setAuthUser(null);
    navigate({ to: "/login" });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "sticky top-0 z-40 bg-white border-b border-slate-200", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between h-14 px-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-lg font-bold text-primary", children: t("common.appName") }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LanguageToggle, {}),
      user && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", ref: menuRef, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => setMenuOpen(!menuOpen),
            className: "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors min-h-[44px]",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold", children: displayName.charAt(0).toUpperCase() }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: displayName })
            ]
          }
        ),
        menuOpen && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute right-0 mt-1 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-3 py-2 border-b border-slate-100", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-slate-900", children: displayName }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500 capitalize", children: user.role })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: handleLogout,
              className: "w-full text-left px-3 py-2 text-sm text-danger hover:bg-slate-50 transition-colors min-h-[44px] flex items-center",
              children: t("nav.logout")
            }
          )
        ] })
      ] })
    ] })
  ] }) });
}
const HomeIcon = () => /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" }) });
const LoansIcon = () => /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" }) });
const NewIcon = () => /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 4.5v15m7.5-7.5h-15" }) });
const PaymentsIcon = () => /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75" }) });
const ProfileIcon = () => /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" }) });
const navItems = [
  { to: "/dashboard", labelKey: "nav.home", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(HomeIcon, {}) },
  { to: "/loans", labelKey: "nav.loans", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(LoansIcon, {}) },
  { to: "/loans/new", labelKey: "nav.newLoan", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(NewIcon, {}) },
  { to: "/payments", labelKey: "nav.payments", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentsIcon, {}) },
  { to: "/borrowers", labelKey: "nav.borrowers", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(ProfileIcon, {}) }
];
function BottomNav() {
  const { t } = useTranslation();
  const matchRoute = useMatchRoute();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { "aria-label": "Main navigation", className: "fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 md:hidden safe-area-bottom", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-around h-16", children: navItems.map((item) => {
    const isActive = !!matchRoute({ to: item.to, fuzzy: true });
    const isNew = item.to === "/loans/new";
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Link,
      {
        to: item.to,
        className: clsx(
          "flex flex-col items-center justify-center gap-0.5 flex-1 h-full",
          "text-xs transition-colors min-w-0",
          isNew ? "text-white" : isActive ? "text-primary" : "text-slate-400 hover:text-slate-600"
        ),
        children: [
          isNew ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center h-10 w-10 rounded-full bg-primary text-white -mt-4 shadow-lg", children: item.icon }) : item.icon,
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: clsx(
            "truncate max-w-full px-1 nav-label",
            isNew && "text-primary"
          ), children: t(item.labelKey) })
        ]
      },
      item.to
    );
  }) }) });
}
const sidebarItems = [
  {
    to: "/dashboard",
    labelKey: "nav.home",
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" }) })
  },
  {
    to: "/loans",
    labelKey: "nav.loans",
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" }) })
  },
  {
    to: "/borrowers",
    labelKey: "nav.borrowers",
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" }) })
  },
  {
    to: "/payments",
    labelKey: "nav.payments",
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75" }) })
  },
  {
    to: "/analytics",
    labelKey: "nav.analytics",
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" }) }),
    adminOnly: true
  },
  {
    to: "/capital",
    labelKey: "nav.capital",
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" }) }),
    adminOnly: true
  },
  {
    to: "/settings",
    labelKey: "nav.settings",
    icon: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" })
    ] }),
    adminOnly: true
  }
];
function Sidebar() {
  const { t } = useTranslation();
  const matchRoute = useMatchRoute();
  const user = useStore(authStore, (s) => s.user);
  const visibleItems = sidebarItems.filter(
    (item) => !item.adminOnly || user?.role === "admin"
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsx("aside", { className: "hidden md:flex md:flex-col md:w-60 bg-white border-r border-slate-200 min-h-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { "aria-label": "Main navigation", className: "flex-1 p-3 space-y-1 overflow-y-auto", children: visibleItems.map((item) => {
    const isActive = !!matchRoute({ to: item.to, fuzzy: true });
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Link,
      {
        to: item.to,
        className: clsx(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          isActive ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        ),
        children: [
          item.icon,
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: t(item.labelKey) })
        ]
      },
      item.to
    );
  }) }) });
}
function AppShell({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-slate-50 flex flex-col", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Header, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 min-h-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Sidebar, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex-1 overflow-y-auto pb-20 md:pb-4 px-4 py-4", children })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(BottomNav, {})
  ] });
}
function AuthenticatedLayout() {
  const {
    user
  } = Route$d.useRouteContext();
  const synced = reactExports.useRef(false);
  if (!synced.current) {
    setAuthUser(user);
    synced.current = true;
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}) });
}
export {
  AuthenticatedLayout as component
};
