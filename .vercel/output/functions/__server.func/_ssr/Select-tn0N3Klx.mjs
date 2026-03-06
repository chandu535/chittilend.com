import { r as reactExports, j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { c as clsx } from "../_libs/clsx.mjs";
const Select = reactExports.forwardRef(
  ({ label, error, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full", children: [
      label && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "label",
        {
          htmlFor: selectId,
          className: "block text-sm font-medium text-slate-700 mb-1",
          children: label
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "select",
        {
          ref,
          id: selectId,
          className: clsx(
            "w-full rounded-lg border bg-white px-3 py-2.5",
            "text-base text-slate-900",
            "min-h-[48px]",
            "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
            "transition-colors appearance-none",
            'bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 12 12%27%3E%3Cpath d=%27M6 8L1 3h10L6 8z%27 fill=%27%2364748b%27/%3E%3C/svg%3E")] bg-no-repeat bg-[right_12px_center]',
            error ? "border-danger focus:ring-danger/30 focus:border-danger" : "border-slate-300",
            className
          ),
          "aria-invalid": error ? "true" : void 0,
          ...props,
          children: [
            placeholder && /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", disabled: true, children: placeholder }),
            options.map((opt) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: opt.value, children: opt.label }, opt.value))
          ]
        }
      ),
      error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-danger", children: error })
    ] });
  }
);
Select.displayName = "Select";
export {
  Select as S
};
