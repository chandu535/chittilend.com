import { j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { c as clsx } from "../_libs/clsx.mjs";
import { S as STATUS_COLORS } from "./constants-DFV23y0t.mjs";
function Badge({ status, children, className }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "span",
    {
      className: clsx(
        "badge inline-flex items-center rounded-full px-2.5 py-0.5",
        "text-xs font-medium",
        STATUS_COLORS[status],
        className
      ),
      children
    }
  );
}
export {
  Badge as B
};
