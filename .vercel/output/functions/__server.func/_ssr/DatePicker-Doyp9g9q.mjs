import { r as reactExports, j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { c as clsx } from "../_libs/clsx.mjs";
const DatePicker = reactExports.forwardRef(
  ({ label, error, className, id, ...props }, ref) => {
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
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          ref,
          id: inputId,
          type: "date",
          className: clsx(
            "w-full rounded-lg border bg-white px-3 py-2.5",
            "text-base text-slate-900",
            "min-h-[48px]",
            "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
            "transition-colors",
            error ? "border-danger focus:ring-danger/30 focus:border-danger" : "border-slate-300",
            className
          ),
          "aria-invalid": error ? "true" : void 0,
          ...props
        }
      ),
      error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-danger", children: error })
    ] });
  }
);
DatePicker.displayName = "DatePicker";
export {
  DatePicker as D
};
