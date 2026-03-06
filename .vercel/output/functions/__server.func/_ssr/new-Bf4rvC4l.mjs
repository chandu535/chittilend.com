import { r as reactExports, j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { u as useNavigate } from "../_chunks/_libs/@tanstack/react-router.mjs";
import { C as Card, a as CardTitle, b as CardDescription } from "./Card-CBpRnpD5.mjs";
import { B as Button, t as toast } from "./router-De5441r5.mjs";
import { B as BorrowerForm } from "./BorrowerForm-B4r6r0wf.mjs";
import { c as clsx } from "../_libs/clsx.mjs";
import { D as DEFAULTS } from "./constants-DFV23y0t.mjs";
import { c as createBorrower } from "./borrowers-C0dlCdLt.mjs";
import { u as useTranslation } from "../_libs/react-i18next.mjs";
import "../_chunks/_libs/@tanstack/router-core.mjs";
import "../_libs/cookie-es.mjs";
import "../_chunks/_libs/@tanstack/history.mjs";
import "../_libs/tiny-invariant.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_chunks/_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/tiny-warning.mjs";
import "../_chunks/_libs/@tanstack/store.mjs";
import "../_chunks/_libs/@tanstack/react-store.mjs";
import "../_libs/use-sync-external-store.mjs";
import "../_libs/i18next.mjs";
import "./index.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "./auth-CwIywibs.mjs";
import "../_libs/joi.mjs";
import "../_chunks/_libs/@hapi/hoek.mjs";
import "../_chunks/_libs/@hapi/formula.mjs";
import "../_chunks/_libs/@hapi/pinpoint.mjs";
import "../_chunks/_libs/@hapi/topo.mjs";
import "../_chunks/_libs/@hapi/address.mjs";
import "url";
import "../_chunks/_libs/@hapi/tlds.mjs";
import "./Input-CQaLwuWI.mjs";
import "./Select-tn0N3Klx.mjs";
import "./NameDisplay-B-OL-WuP.mjs";
import "./borrower-ffkpRuRL.mjs";
function CameraCapture({ onCapture, onLocation }) {
  const { t } = useTranslation();
  const videoRef = reactExports.useRef(null);
  const canvasRef = reactExports.useRef(null);
  const [stream, setStream] = reactExports.useState(null);
  const [preview, setPreview] = reactExports.useState(null);
  const [error, setError] = reactExports.useState(null);
  const startCamera = reactExports.useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 960 } }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      if (onLocation && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => onLocation(pos.coords.latitude, pos.coords.longitude),
          () => {
          },
          { enableHighAccuracy: true, timeout: 1e4 }
        );
      }
    } catch {
      setError("Camera not available");
    }
  }, [onLocation]);
  const capture = reactExports.useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `capture-${Date.now()}.jpg`, {
            type: "image/jpeg"
          });
          setPreview(URL.createObjectURL(blob));
          onCapture(file);
          stream?.getTracks().forEach((t2) => t2.stop());
          setStream(null);
        }
      },
      "image/jpeg",
      0.85
    );
  }, [stream, onCapture]);
  const reset = reactExports.useCallback(() => {
    setPreview(null);
    stream?.getTracks().forEach((t2) => t2.stop());
    setStream(null);
  }, [stream]);
  if (error) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-red-500 text-center py-4", children: error });
  }
  if (preview) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: preview, alt: "Captured", className: "w-full rounded-lg" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: reset, className: "w-full", children: t("common.edit") })
    ] });
  }
  if (stream) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "video",
        {
          ref: videoRef,
          autoPlay: true,
          playsInline: true,
          muted: true,
          className: "w-full rounded-lg bg-black"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("canvas", { ref: canvasRef, className: "hidden" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: capture, className: "w-full", children: t("borrowers.capturePhoto") })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "secondary", onClick: startCamera, className: "w-full", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" })
    ] }),
    t("borrowers.capturePhoto")
  ] });
}
function FileUpload({
  label,
  error,
  accept = DEFAULTS.ALLOWED_IMAGE_TYPES.join(","),
  maxSize = DEFAULTS.MAX_FILE_SIZE,
  onFileSelect,
  className,
  loading = false
}) {
  const inputRef = reactExports.useRef(null);
  const [preview, setPreview] = reactExports.useState(null);
  const [fileName, setFileName] = reactExports.useState(null);
  const [sizeError, setSizeError] = reactExports.useState(null);
  const handleChange = reactExports.useCallback(
    (e) => {
      const file = e.target.files?.[0] ?? null;
      setSizeError(null);
      if (!file) {
        setPreview(null);
        setFileName(null);
        onFileSelect(null);
        return;
      }
      if (file.size > maxSize) {
        const maxMB = Math.round(maxSize / (1024 * 1024));
        setSizeError(`File size must be under ${maxMB}MB`);
        e.target.value = "";
        return;
      }
      setFileName(file.name);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setPreview(ev.target?.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
      onFileSelect(file);
    },
    [maxSize, onFileSelect]
  );
  const handleClear = reactExports.useCallback(() => {
    setPreview(null);
    setFileName(null);
    setSizeError(null);
    onFileSelect(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [onFileSelect]);
  const displayError = error || sizeError;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: clsx("w-full", className), children: [
    label && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "block text-sm font-medium text-slate-700 mb-1", children: label }),
    preview ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative rounded-lg border border-slate-300 overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "img",
        {
          src: preview,
          alt: "Preview",
          className: "w-full max-h-48 object-contain bg-slate-50"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: handleClear,
          className: "absolute top-2 right-2 rounded-full bg-white/90 p-1.5 shadow-sm hover:bg-white min-h-[44px] min-w-[44px] flex items-center justify-center",
          "aria-label": "Remove file",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-4 w-4 text-slate-600", viewBox: "0 0 20 20", fill: "currentColor", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "path",
            {
              fillRule: "evenodd",
              d: "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z",
              clipRule: "evenodd"
            }
          ) })
        }
      )
    ] }) : fileName ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-slate-700 truncate flex-1", children: fileName }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: handleClear,
          className: "text-slate-400 hover:text-slate-600 min-h-[44px] min-w-[44px] flex items-center justify-center",
          "aria-label": "Remove file",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-4 w-4", viewBox: "0 0 20 20", fill: "currentColor", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "path",
            {
              fillRule: "evenodd",
              d: "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z",
              clipRule: "evenodd"
            }
          ) })
        }
      )
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        onClick: () => inputRef.current?.click(),
        className: clsx(
          "w-full rounded-lg border-2 border-dashed px-4 py-6",
          "flex flex-col items-center gap-2",
          "text-sm text-slate-500",
          "hover:border-primary hover:text-primary transition-colors",
          "min-h-[48px]",
          displayError ? "border-danger" : "border-slate-300"
        ),
        children: [
          loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "h-6 w-6 animate-spin", viewBox: "0 0 24 24", fill: "none", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-8 w-8", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: loading ? "Uploading..." : "Tap to upload" })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        ref: inputRef,
        type: "file",
        accept,
        onChange: handleChange,
        className: "hidden",
        "aria-hidden": "true"
      }
    ),
    displayError && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-danger", children: displayError })
  ] });
}
function NewBorrowerPage() {
  const {
    t
  } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = reactExports.useState(1);
  const [loading, setLoading] = reactExports.useState(false);
  const [formData, setFormData] = reactExports.useState(null);
  const [_profilePhoto, setProfilePhoto] = reactExports.useState(null);
  const [_aadhaarPhoto, setAadhaarPhoto] = reactExports.useState(null);
  const handleFormNext = async (data) => {
    setFormData(data);
    setStep(2);
  };
  const handleSubmit = async () => {
    if (!formData) return;
    setLoading(true);
    try {
      const borrower = await createBorrower({
        data: formData
      });
      toast(t("borrowers.createSuccess"), "success");
      navigate({
        to: "/borrowers/$borrowerId",
        params: {
          borrowerId: borrower.id
        }
      });
    } catch (err) {
      toast(err instanceof Error ? err.message : t("errors.generic"), "error");
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-lg mx-auto space-y-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-slate-900", children: t("borrowers.newBorrower") }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(StepPill, { number: 1, label: t("borrowers.stepDetails"), active: step === 1, completed: step > 1, onClick: () => step > 1 && setStep(1) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StepPill, { number: 2, label: t("borrowers.stepPhotos"), active: step === 2, completed: false })
    ] }),
    step === 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: t("borrowers.stepDetails") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: t("borrowers.stepDetailsDesc") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(BorrowerForm, { initialData: formData ?? void 0, onSubmit: handleFormNext, submitLabel: t("common.next") })
    ] }),
    step === 2 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: t("borrowers.profilePhoto") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: t("borrowers.stepPhotosDesc") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CameraCapture, { onCapture: (file) => setProfilePhoto(file) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 pt-3 border-t border-slate-100", children: /* @__PURE__ */ jsxRuntimeExports.jsx(FileUpload, { label: t("borrowers.uploadPhoto"), onFileSelect: (file) => {
          if (file) setProfilePhoto(file);
        } }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: t("borrowers.aadhaarPhoto") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(FileUpload, { label: t("borrowers.aadhaarPhoto"), onFileSelect: (file) => {
          if (file) setAadhaarPhoto(file);
        } }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", className: "flex-1", onClick: () => setStep(1), children: t("common.back") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "flex-1", onClick: handleSubmit, loading, children: t("common.save") })
      ] })
    ] })
  ] });
}
function StepPill({
  number,
  label,
  active,
  completed,
  onClick
}) {
  const isClickable = completed && onClick;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: isClickable ? onClick : void 0, className: `
        flex-1 flex items-center gap-2.5 rounded-xl px-4 py-3 transition-colors
        ${active ? "bg-primary/10 border-2 border-primary" : completed ? "bg-emerald-50 border-2 border-emerald-200 cursor-pointer" : "bg-slate-50 border-2 border-slate-200"}
        ${!isClickable && !active ? "cursor-default" : ""}
      `, "aria-current": active ? "step" : void 0, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `
          flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold shrink-0
          ${active ? "bg-primary text-white" : completed ? "bg-emerald-500 text-white" : "bg-slate-300 text-white"}
        `, children: completed ? /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 3, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 13l4 4L19 7" }) }) : number }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-sm font-medium ${active ? "text-primary" : completed ? "text-emerald-700" : "text-slate-400"}`, children: label })
  ] });
}
export {
  NewBorrowerPage as component
};
