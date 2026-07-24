import { j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { c as clsx } from "../_libs/clsx.mjs";
const paddingStyles = {
  sm: "p-3",
  md: "p-4",
  lg: "p-6"
};
function Card({ children, padding = "md", className, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: clsx(
        "rounded-2xl bg-white shadow-[0_2px_16px_rgba(109,40,217,0.06)] border-0",
        paddingStyles[padding],
        className
      ),
      ...props,
      children
    }
  );
}
function CardTitle({ children, className }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: clsx("card-title text-[15px] font-semibold text-slate-800", className), children });
}
function CardDescription({ children, className }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: clsx("text-sm text-slate-500 mt-1", className), children });
}
export {
  Card as C,
  CardTitle as a,
  CardDescription as b
};
