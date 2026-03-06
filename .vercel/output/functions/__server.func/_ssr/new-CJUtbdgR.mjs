import { r as reactExports, j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { u as useNavigate } from "../_chunks/_libs/@tanstack/react-router.mjs";
import { C as Card, a as CardTitle } from "./Card-BK1rG6VK.mjs";
import { I as Input } from "./Input-CQaLwuWI.mjs";
import { S as Select } from "./Select-tn0N3Klx.mjs";
import { B as Button, t as toast, d as createSsrRpc } from "./router-CLGnVP9u.mjs";
import { N as NameDisplay } from "./NameDisplay-B5K8GAeS.mjs";
import { c as createBorrower, s as searchBorrowers } from "./borrowers-D3qd7hME.mjs";
import { c as clsx } from "../_libs/clsx.mjs";
import { D as DEFAULTS } from "./constants-DFV23y0t.mjs";
import { c as createServerFn } from "./index.mjs";
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
import "./auth-CwIywibs.mjs";
import "../_libs/joi.mjs";
import "../_chunks/_libs/@hapi/hoek.mjs";
import "../_chunks/_libs/@hapi/formula.mjs";
import "../_chunks/_libs/@hapi/pinpoint.mjs";
import "../_chunks/_libs/@hapi/topo.mjs";
import "../_chunks/_libs/@hapi/address.mjs";
import "url";
import "../_chunks/_libs/@hapi/tlds.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "./borrower-C6HD2kfy.mjs";
function BorrowerForm({ initialData, onSubmit, loading }) {
  const { t } = useTranslation();
  const [data, setData] = reactExports.useState({
    name: initialData?.name || "",
    mobile: initialData?.mobile || "",
    area: initialData?.area || "",
    address: initialData?.address || "",
    suretyType: initialData?.suretyType || "owner",
    suretyReferenceId: initialData?.suretyReferenceId || ""
  });
  const [errors, setErrors] = reactExports.useState({});
  const [suretyResults, setSuretyResults] = reactExports.useState([]);
  const [suretySearch, setSuretySearch] = reactExports.useState("");
  const validate = () => {
    const errs = {};
    if (!data.name || data.name.trim().length < 2) {
      errs.name = t("common.required");
    }
    if (!data.mobile || !/^[0-9]{10}$/.test(data.mobile)) {
      errs.mobile = t("borrowers.mobileHint");
    }
    if (data.suretyType === "existing_borrower" && !data.suretyReferenceId) {
      errs.suretyReferenceId = t("common.required");
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(data);
  };
  const handleSuretySearch = async (query) => {
    setSuretySearch(query);
    if (query.length < 1) {
      setSuretyResults([]);
      return;
    }
    try {
      const results = await searchBorrowers({ data: { query } });
      setSuretyResults(results);
    } catch {
      setSuretyResults([]);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Input,
      {
        label: t("borrowers.name"),
        value: data.name,
        onChange: (e) => setData((d) => ({ ...d, name: e.target.value })),
        error: errors.name,
        required: true
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Input,
      {
        label: t("borrowers.mobile"),
        value: data.mobile,
        onChange: (e) => setData((d) => ({ ...d, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })),
        error: errors.mobile,
        hint: t("borrowers.mobileHint"),
        inputMode: "numeric",
        lang: "en",
        required: true
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Input,
      {
        label: t("borrowers.area"),
        value: data.area,
        onChange: (e) => setData((d) => ({ ...d, area: e.target.value }))
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Input,
      {
        label: t("borrowers.address"),
        value: data.address,
        onChange: (e) => setData((d) => ({ ...d, address: e.target.value }))
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Select,
      {
        label: t("borrowers.surety"),
        value: data.suretyType,
        onChange: (e) => {
          setData((d) => ({
            ...d,
            suretyType: e.target.value,
            suretyReferenceId: ""
          }));
          setSuretyResults([]);
          setSuretySearch("");
        },
        options: [
          { value: "owner", label: t("borrowers.suretyOwner") },
          { value: "existing_borrower", label: t("borrowers.suretyExisting") }
        ]
      }
    ),
    data.suretyType === "existing_borrower" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          label: t("borrowers.suretyReference"),
          value: suretySearch,
          onChange: (e) => handleSuretySearch(e.target.value),
          error: errors.suretyReferenceId,
          placeholder: t("common.search")
        }
      ),
      suretyResults.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-1 rounded-lg border border-slate-200 bg-white divide-y divide-slate-100 max-h-40 overflow-y-auto", children: suretyResults.map((b) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          className: "w-full text-left px-3 py-2 text-sm hover:bg-slate-50 min-h-[44px]",
          onClick: () => {
            setData((d) => ({ ...d, suretyReferenceId: b.id }));
            setSuretySearch(b.name);
            setSuretyResults([]);
          },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(NameDisplay, { name: b.name }),
            " — ",
            b.mobile
          ]
        }
      ) }, b.id)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", className: "w-full", loading, children: t("common.save") })
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
const getPresignedUploadUrl = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const input = data;
  if (!input.fileType || !input.contentType || !input.borrowerId) {
    throw new Error("fileType, contentType, and borrowerId are required");
  }
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(input.contentType)) {
    throw new Error("Only JPEG, PNG, and WebP images are allowed");
  }
  return input;
}).handler(createSsrRpc("ee94996390d9a8774cce534dac34e7b94f6571e967cea4cc5d6b717117a2d1cb"));
const confirmUpload = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const input = data;
  if (!input.fileKey || !input.borrowerId || !input.docType) {
    throw new Error("fileKey, borrowerId, and docType are required");
  }
  return input;
}).handler(createSsrRpc("cd0db2762451acabf153c2fca29952e46a9a8339e17b4e6000a5be492bda8345"));
function DocumentUpload({ borrowerId, onProfilePhoto, onAadhaarPhoto, onLocation }) {
  const { t } = useTranslation();
  const [uploading, setUploading] = reactExports.useState(null);
  const handleUpload = async (file, docType) => {
    if (!borrowerId) {
      if (docType === "profile") onProfilePhoto(file);
      else onAadhaarPhoto(file);
      return;
    }
    setUploading(docType);
    try {
      const { uploadUrl, fileKey } = await getPresignedUploadUrl({
        data: {
          fileType: docType,
          contentType: file.type,
          borrowerId
        }
      });
      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type }
      });
      await confirmUpload({
        data: { fileKey, borrowerId, docType }
      });
      toast(t("common.save"), "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : t("errors.generic"), "error");
    } finally {
      setUploading(null);
    }
    if (docType === "profile") onProfilePhoto(file);
    else onAadhaarPhoto(file);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-slate-700 mb-2", children: t("borrowers.profilePhoto") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        CameraCapture,
        {
          onCapture: (file) => handleUpload(file, "profile"),
          onLocation
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        FileUpload,
        {
          label: t("borrowers.uploadPhoto"),
          onFileSelect: (file) => {
            if (file) handleUpload(file, "profile");
            else onProfilePhoto(null);
          },
          loading: uploading === "profile"
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      FileUpload,
      {
        label: t("borrowers.aadhaarPhoto"),
        onFileSelect: (file) => {
          if (file) handleUpload(file, "aadhaar");
          else onAadhaarPhoto(null);
        },
        loading: uploading === "aadhaar"
      }
    )
  ] });
}
function NewBorrowerPage() {
  const {
    t
  } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = reactExports.useState(false);
  const [_profilePhoto, setProfilePhoto] = reactExports.useState(null);
  const [_aadhaarPhoto, setAadhaarPhoto] = reactExports.useState(null);
  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      const borrower = await createBorrower({
        data
      });
      toast(t("borrowers.newBorrower") + " created", "success");
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
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-lg mx-auto space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-slate-900", children: t("borrowers.newBorrower") }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: t("borrowers.name") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(BorrowerForm, { onSubmit: handleSubmit, loading })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: t("borrowers.aadhaarPhoto") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DocumentUpload, { onProfilePhoto: setProfilePhoto, onAadhaarPhoto: setAadhaarPhoto })
    ] })
  ] });
}
export {
  NewBorrowerPage as component
};
