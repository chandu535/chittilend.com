import { j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { u as useStore } from "../_chunks/_libs/@tanstack/react-store.mjs";
import { u as uiStore } from "./router-BkdMoR6V.mjs";
import { a as formatMonthYear, c as formatINRCompact } from "./formatters-khdU1uWq.mjs";
import { u as useTranslation } from "../_libs/react-i18next.mjs";
function CollectionChart({ data }) {
  const { t } = useTranslation();
  const lang = useStore(uiStore, (s) => s.language);
  if (data.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-100 bg-white shadow-sm p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-slate-900 mb-3", children: t("analytics.capitalFlow") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-400 py-8 text-center", children: t("analytics.noData") })
    ] });
  }
  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.collections, d.disbursements)),
    1
  );
  const chartHeight = 160;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-100 bg-white shadow-sm p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-slate-900 mb-3", children: t("analytics.capitalFlow") }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4 mb-3 text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 w-3 rounded-sm bg-emerald-500" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-500", children: t("analytics.collections") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 w-3 rounded-sm bg-red-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-500", children: t("analytics.disbursements") })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "svg",
      {
        viewBox: `0 0 ${Math.max(data.length * 80, 320)} ${chartHeight + 40}`,
        className: "w-full min-w-[320px]",
        style: { height: chartHeight + 40 },
        children: [
          data.map((d, i) => {
            const x = i * 80 + 20;
            const barWidth = 24;
            const collH = d.collections / maxVal * chartHeight;
            const disbH = d.disbursements / maxVal * chartHeight;
            const monthDate = /* @__PURE__ */ new Date(d.month + "-01");
            const monthLabel = formatMonthYear(monthDate, { lang }).split(" ")[0].slice(0, 3);
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "rect",
                {
                  x,
                  y: chartHeight - collH,
                  width: barWidth,
                  height: collH,
                  rx: 4,
                  className: "fill-emerald-500"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "rect",
                {
                  x: x + barWidth + 4,
                  y: chartHeight - disbH,
                  width: barWidth,
                  height: disbH,
                  rx: 4,
                  className: "fill-red-400"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "text",
                {
                  x: x + barWidth + 2,
                  y: chartHeight + 16,
                  textAnchor: "middle",
                  className: "fill-slate-400 text-[10px]",
                  children: monthLabel
                }
              )
            ] }, d.month);
          }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "line",
            {
              x1: "0",
              y1: chartHeight,
              x2: data.length * 80 + 20,
              y2: chartHeight,
              className: "stroke-slate-200",
              strokeWidth: 1
            }
          )
        ]
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-xs text-slate-400 mt-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "0" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatINRCompact(maxVal, { lang }) })
    ] })
  ] });
}
export {
  CollectionChart as C
};
