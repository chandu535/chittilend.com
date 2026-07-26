import { r as reactExports, j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { c as clsx } from "../_libs/clsx.mjs";
import { u as useLocalizedName } from "./NameDisplay-BEn732AH.mjs";
import { r as reactDomExports } from "../_chunks/_libs/react-dom.mjs";
function PhotoPreview({ src, alt, onClose }) {
  reactExports.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);
  return reactDomExports.createPortal(
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "fixed inset-0 z-[100] flex flex-col bg-black/95",
        onClick: onClose,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "flex-1 overflow-auto flex items-center justify-center p-4",
              onClick: (e) => e.stopPropagation(),
              style: { touchAction: "pan-x pan-y pinch-zoom" },
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "img",
                {
                  src,
                  alt,
                  className: "max-w-full max-h-full object-contain select-none rounded-lg",
                  draggable: false
                }
              )
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "shrink-0 flex justify-center pb-10 pt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: onClose,
              className: "h-16 w-16 rounded-full bg-white shadow-2xl flex items-center justify-center active:scale-95 transition-transform",
              "aria-label": "Close",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-7 w-7 text-slate-800", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" }) })
            }
          ) })
        ]
      }
    ),
    document.body
  );
}
function BorrowerAvatar({ name, photoUrl, size = "md", className }) {
  const [previewing, setPreviewing] = reactExports.useState(false);
  const displayName = useLocalizedName(name);
  const sizeClass = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-14 w-14 text-xl" : "h-10 w-10 text-sm";
  const handleClick = (e) => {
    if (!photoUrl) return;
    e.preventDefault();
    e.stopPropagation();
    setPreviewing(true);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        role: photoUrl ? "button" : void 0,
        "aria-label": photoUrl ? `View photo of ${displayName}` : void 0,
        onClick: handleClick,
        className: clsx(
          sizeClass,
          "rounded-full shrink-0 overflow-hidden flex items-center justify-center font-semibold select-none",
          photoUrl ? "cursor-pointer ring-2 ring-white hover:ring-primary/40 transition-shadow" : "bg-primary/10 text-primary",
          className
        ),
        children: photoUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "img",
          {
            src: photoUrl,
            alt: displayName,
            className: "h-full w-full object-cover",
            draggable: false
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: displayName.charAt(0).toUpperCase() })
      }
    ),
    previewing && photoUrl && /* @__PURE__ */ jsxRuntimeExports.jsx(
      PhotoPreview,
      {
        src: photoUrl,
        alt: displayName,
        onClose: () => setPreviewing(false)
      }
    )
  ] });
}
export {
  BorrowerAvatar as B
};
