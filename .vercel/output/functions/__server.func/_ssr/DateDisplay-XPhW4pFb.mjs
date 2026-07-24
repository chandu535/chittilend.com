import { j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { u as useStore } from "../_chunks/_libs/@tanstack/react-store.mjs";
import { u as uiStore } from "./router-_jeUSzJ6.mjs";
import { e as formatDate } from "./formatters-khdU1uWq.mjs";
function DateDisplay({ date, className }) {
  const language = useStore(uiStore, (s) => s.language);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className, children: formatDate(date, { lang: language }) });
}
export {
  DateDisplay as D
};
