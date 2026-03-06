import { j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
function EmptyState({ icon, title, description, action }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-12 px-4 text-center", children: [
    icon && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-slate-300 mb-4", children: icon }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-slate-700", children: title }),
    description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-500 max-w-sm", children: description }),
    action && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4", children: action })
  ] });
}
export {
  EmptyState as E
};
