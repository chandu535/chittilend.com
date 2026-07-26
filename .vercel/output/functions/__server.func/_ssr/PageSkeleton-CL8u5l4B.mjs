import { j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { c as clsx } from "../_libs/clsx.mjs";
function Block({ className }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: clsx("animate-pulse rounded-lg bg-slate-200/80", className) });
}
function PageSkeleton({ variant = "list" }) {
  if (variant === "dashboard") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5 animate-pulse", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Block, { className: "h-8 w-40" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-3 sm:grid-cols-4", children: Array.from({ length: 4 }, (_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Block, { className: "h-28" }, i)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Block, { className: "h-48" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Block, { className: "h-36" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Block, { className: "h-36" })
      ] })
    ] });
  }
  if (variant === "detail" || variant === "portal") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 animate-pulse", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Block, { className: "h-8 w-48" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Block, { className: "h-28" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Block, { className: "h-24" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Block, { className: "h-24" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Block, { className: "h-44" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Block, { className: "h-36" })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 animate-pulse", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Block, { className: "h-8 w-32" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Block, { className: "h-10 w-28" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Block, { className: "h-11 w-full" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: clsx("space-y-3", variant === "table" && "hidden sm:block"), children: Array.from({ length: 5 }, (_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Block, { className: "h-24" }, i)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: clsx("space-y-3 sm:hidden", variant !== "table" && "hidden"), children: Array.from({ length: 4 }, (_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Block, { className: "h-28" }, i)) })
  ] });
}
function InlineSkeleton({ className }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Block, { className });
}
export {
  InlineSkeleton as I,
  PageSkeleton as P
};
