import { r as reactExports, j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { u as useNavigate } from "../_chunks/_libs/@tanstack/react-router.mjs";
import { C as Card, a as CardTitle, b as CardDescription } from "./Card-BGH86XgU.mjs";
import { B as Button, t as toast } from "./router-_jeUSzJ6.mjs";
import { B as BorrowerForm, C as CameraCapture, F as FileUpload, u as uploadBorrowerPhoto } from "./upload-jTke5qms.mjs";
import { c as createBorrower } from "./borrowers-BAidYgmg.mjs";
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
import "../_libs/clsx.mjs";
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
import "./Input-DxOP6u0W.mjs";
import "./Select-tn0N3Klx.mjs";
import "./NameDisplay-CsHOu8cU.mjs";
import "./constants-CT9Kuti2.mjs";
import "./borrower-Bf161yIl.mjs";
function NewBorrowerPage() {
  const {
    t
  } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = reactExports.useState(1);
  const [loading, setLoading] = reactExports.useState(false);
  const [formData, setFormData] = reactExports.useState(null);
  const [profilePhoto, setProfilePhoto] = reactExports.useState(null);
  const [aadhaarPhoto, setAadhaarPhoto] = reactExports.useState(null);
  const handleFormNext = async (data) => {
    setFormData(data);
    setStep(2);
  };
  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const uploadPhoto = async (file, borrowerId, docType) => {
    const fileData = await fileToBase64(file);
    await uploadBorrowerPhoto({
      data: {
        borrowerId,
        docType,
        fileData,
        contentType: file.type
      }
    });
  };
  const handleSubmit = async () => {
    if (!formData) return;
    setLoading(true);
    try {
      const {
        locationUrl: _locationUrl,
        ...borrowerData
      } = formData;
      const borrower = await createBorrower({
        data: borrowerData
      });
      const uploads = [];
      if (profilePhoto) uploads.push(uploadPhoto(profilePhoto, borrower.id, "profile"));
      if (aadhaarPhoto) uploads.push(uploadPhoto(aadhaarPhoto, borrower.id, "aadhaar"));
      if (uploads.length > 0) await Promise.all(uploads);
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
