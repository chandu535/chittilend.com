import { r as reactExports, j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { c as clsx } from "../_libs/clsx.mjs";
const Input = reactExports.forwardRef(
  ({ label, error, hint, leftIcon, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full", children: [
      label && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "label",
        {
          htmlFor: inputId,
          className: "block text-sm font-medium text-slate-700 mb-1",
          children: label
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
        leftIcon && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400", children: leftIcon }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            ref,
            id: inputId,
            className: clsx(
              "w-full rounded-xl border bg-white px-3.5 py-2.5",
              "text-[15px] text-slate-900 placeholder:text-slate-400",
              "min-h-[48px]",
              "focus:outline-none focus:ring-2 focus:ring-violet-300/60 focus:border-violet-400",
              "transition-all duration-150",
              "shadow-[0_1px_4px_rgba(0,0,0,0.06)]",
              error ? "border-red-300 focus:ring-red-300/60 focus:border-red-400" : "border-slate-200",
              leftIcon && "pl-10",
              className
            ),
            "aria-invalid": error ? "true" : void 0,
            "aria-describedby": error ? `${inputId}-error` : hint ? `${inputId}-hint` : void 0,
            ...props
          }
        )
      ] }),
      error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { id: `${inputId}-error`, className: "mt-1 text-sm text-danger", children: error }),
      hint && !error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { id: `${inputId}-hint`, className: "mt-1 text-sm text-slate-400", children: hint })
    ] });
  }
);
Input.displayName = "Input";
export {
  Input as I
};
