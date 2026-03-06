import { j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { u as useStore } from "../_chunks/_libs/@tanstack/react-store.mjs";
import { u as uiStore } from "./router-De5441r5.mjs";
import { g as formatINR } from "./formatters-khdU1uWq.mjs";
function CurrencyDisplay({ amount, className }) {
  const language = useStore(uiStore, (s) => s.language);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className, children: formatINR(amount, { lang: language }) });
}
export {
  CurrencyDisplay as C
};
