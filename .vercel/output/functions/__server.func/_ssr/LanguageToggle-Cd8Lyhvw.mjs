import { j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { u as useStore } from "../_chunks/_libs/@tanstack/react-store.mjs";
import { u as uiStore, d as setLanguage } from "./router-BkdMoR6V.mjs";
import { u as useTranslation } from "../_libs/react-i18next.mjs";
function LanguageToggle() {
  const language = useStore(uiStore, (s) => s.language);
  const { i18n } = useTranslation();
  const toggle = () => {
    const newLang = language === "en" ? "te" : "en";
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      onClick: toggle,
      className: "flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors min-h-[44px]",
      "aria-label": language === "en" ? "Switch to Telugu" : "Switch to English",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: language === "en" ? "font-bold text-primary" : "text-slate-400", children: "EN" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-300", children: "/" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: language === "te" ? "font-bold text-primary" : "text-slate-400", children: "తె" })
      ]
    }
  );
}
export {
  LanguageToggle as L
};
