import { r as reactExports, j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { u as useNavigate, L as Link } from "../_chunks/_libs/@tanstack/react-router.mjs";
import { g as getBorrowerById, u as updateBorrower, d as deleteBorrower, b as generateNewMagicLink } from "./borrowers-DZZMFZOE.mjs";
import { C as Card, a as CardTitle } from "./Card-BGH86XgU.mjs";
import { B as Badge } from "./Badge-BExCBNfX.mjs";
import { p as Route, B as Button, t as toast } from "./router-BkdMoR6V.mjs";
import { P as PageSkeleton } from "./PageSkeleton-CL8u5l4B.mjs";
import { c as clsx } from "../_libs/clsx.mjs";
import { B as BorrowerForm, C as CameraCapture, F as FileUpload, u as uploadBorrowerPhoto } from "./upload-CfWVUvuO.mjs";
import { B as BorrowerAvatar } from "./BorrowerAvatar-C75IJ0wD.mjs";
import { C as CurrencyDisplay } from "./CurrencyDisplay-DxtEIDNl.mjs";
import { u as useLocalizedName } from "./NameDisplay-BEn732AH.mjs";
import { g as formatPhone } from "./formatters-khdU1uWq.mjs";
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
import "./borrower-Bf161yIl.mjs";
import "../_libs/joi.mjs";
import "../_chunks/_libs/@hapi/hoek.mjs";
import "../_chunks/_libs/@hapi/formula.mjs";
import "../_chunks/_libs/@hapi/pinpoint.mjs";
import "../_chunks/_libs/@hapi/topo.mjs";
import "../_chunks/_libs/@hapi/address.mjs";
import "url";
import "../_chunks/_libs/@hapi/tlds.mjs";
import "./constants-CT9Kuti2.mjs";
import "./index.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "../_chunks/_libs/@tanstack/store.mjs";
import "../_chunks/_libs/@tanstack/react-store.mjs";
import "../_libs/use-sync-external-store.mjs";
import "../_libs/i18next.mjs";
import "./auth-CwIywibs.mjs";
import "./Input-DxOP6u0W.mjs";
import "./Select-tn0N3Klx.mjs";
const sizeStyles = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg"
};
function Modal({ isOpen, onClose, title, children, size = "md" }) {
  const overlayRef = reactExports.useRef(null);
  const contentRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      ref: overlayRef,
      className: "fixed inset-0 z-50 flex items-center justify-center p-4",
      onClick: (e) => {
        if (e.target === overlayRef.current) onClose();
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 bg-black/50" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            ref: contentRef,
            className: clsx(
              "relative w-full rounded-xl bg-white shadow-xl",
              "max-h-[90vh] overflow-y-auto",
              sizeStyles[size]
            ),
            role: "dialog",
            "aria-modal": "true",
            "aria-label": title,
            children: [
              title && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-slate-200 px-5 py-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-slate-900", children: title }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    onClick: onClose,
                    className: "rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center",
                    "aria-label": "Close",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-5 w-5", viewBox: "0 0 20 20", fill: "currentColor", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "path",
                      {
                        fillRule: "evenodd",
                        d: "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z",
                        clipRule: "evenodd"
                      }
                    ) })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-5", children })
            ]
          }
        )
      ]
    }
  );
}
function MagicLinkGenerator({ borrowerId, portalToken: initialToken }) {
  const { t } = useTranslation();
  const [token, setToken] = reactExports.useState(initialToken);
  const [regenerating, setRegenerating] = reactExports.useState(false);
  const portalUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/portal/${token}`;
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(portalUrl);
      toast(t("borrowers.linkCopied"), "success");
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = portalUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      toast(t("borrowers.linkCopied"), "success");
    }
  };
  const handleRegenerate = async () => {
    if (!confirm(t("common.confirm") + "?")) return;
    setRegenerating(true);
    try {
      const result = await generateNewMagicLink({ data: { id: borrowerId } });
      setToken(result.portalToken);
      toast(t("borrowers.magicLink") + " updated", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : t("errors.generic"), "error");
    } finally {
      setRegenerating(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-slate-700", children: t("borrowers.magicLink") }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          readOnly: true,
          value: portalUrl,
          className: "flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600 truncate min-h-[44px]"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", size: "sm", onClick: handleCopy, children: t("borrowers.copyLink") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Button,
      {
        variant: "ghost",
        size: "sm",
        onClick: handleRegenerate,
        loading: regenerating,
        children: t("borrowers.generateLink")
      }
    )
  ] });
}
const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result.split(",")[1]);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});
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
      const fileData = await fileToBase64(file);
      await uploadBorrowerPhoto({ data: { borrowerId, docType, fileData, contentType: file.type } });
      toast(t("common.save"), "success");
      if (docType === "profile") onProfilePhoto(file);
      else onAadhaarPhoto(file);
    } catch (err) {
      toast(err instanceof Error ? err.message : t("errors.generic"), "error");
    } finally {
      setUploading(null);
    }
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
function BorrowerDetailPage() {
  const {
    borrowerId
  } = Route.useParams();
  const navigate = useNavigate();
  const {
    t
  } = useTranslation();
  const [borrower, setBorrower] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [editOpen, setEditOpen] = reactExports.useState(false);
  const [deleteOpen, setDeleteOpen] = reactExports.useState(false);
  const [saving, setSaving] = reactExports.useState(false);
  const [locationSaving, setLocationSaving] = reactExports.useState(false);
  const [deleting, setDeleting] = reactExports.useState(false);
  const displayName = useLocalizedName(borrower?.name ?? "");
  const fetchBorrower = reactExports.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBorrowerById({
        data: {
          id: borrowerId
        }
      });
      setBorrower(data);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [borrowerId]);
  reactExports.useEffect(() => {
    fetchBorrower();
  }, [fetchBorrower]);
  const handleUpdate = async (formData) => {
    setSaving(true);
    try {
      const {
        locationUrl: _locationUrl,
        ...borrowerData
      } = formData;
      await updateBorrower({
        data: {
          id: borrowerId,
          ...borrowerData
        }
      });
      setEditOpen(false);
      toast(t("borrowers.updateSuccess"), "success");
      await fetchBorrower();
    } catch (err) {
      toast(err instanceof Error ? err.message : t("errors.generic"), "error");
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteBorrower({
        data: {
          id: borrowerId
        }
      });
      toast(t("borrowers.deleteSuccess"), "success");
      navigate({
        to: "/borrowers"
      });
    } catch (err) {
      const message = err instanceof Error && err.message.includes("BORROWER_HAS_ACTIVE_LOANS") ? t("borrowers.hasActiveLoans") : err instanceof Error ? err.message : t("errors.generic");
      toast(message, "error");
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  };
  const captureLocation = () => {
    if (!navigator.geolocation) {
      toast(t("borrowers.locationUnavailable"), "error");
      return;
    }
    setLocationSaving(true);
    navigator.geolocation.getCurrentPosition(async ({
      coords
    }) => {
      try {
        await updateBorrower({
          data: {
            id: borrowerId,
            locationLat: coords.latitude,
            locationLng: coords.longitude
          }
        });
        toast(t("borrowers.updateSuccess"), "success");
        await fetchBorrower();
      } catch (err) {
        toast(err instanceof Error ? err.message : t("errors.generic"), "error");
      } finally {
        setLocationSaving(false);
      }
    }, () => {
      toast(t("borrowers.locationUnavailable"), "error");
      setLocationSaving(false);
    }, {
      enableHighAccuracy: true,
      timeout: 1e4
    });
  };
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(PageSkeleton, { variant: "detail" });
  }
  if (!borrower) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center text-slate-500 py-12", children: t("errors.notFound") });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mx-auto space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/borrowers", className: "text-slate-400 hover:text-slate-600", children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M15 19l-7-7 7-7" }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-slate-900 flex-1", children: displayName }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setEditOpen(true), className: "rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center", "aria-label": t("borrowers.editBorrower"), children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setDeleteOpen(true), className: "rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center", "aria-label": t("borrowers.deleteBorrower"), children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" }) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(BorrowerAvatar, { name: borrower.name, photoUrl: borrower.profilePhotoUrl, size: "lg" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0 space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-semibold text-slate-900", children: displayName }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-600", children: formatPhone(borrower.mobile) }),
        borrower.area && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-500", children: borrower.area }),
        borrower.address && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-400", children: borrower.address }),
        borrower.locationLat && borrower.locationLng && /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: `https://www.google.com/maps?q=${borrower.locationLat},${borrower.locationLng}`, target: "_blank", rel: "noreferrer", className: "inline-flex items-center gap-1 text-sm text-primary hover:underline", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "⌖" }),
          t("borrowers.openLocation")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: captureLocation, disabled: locationSaving, className: "ml-3 inline-flex items-center gap-1 text-sm text-primary hover:underline disabled:opacity-50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "⌖" }),
          t("borrowers.captureLocation")
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: t("loans.title") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/loans/new", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", children: t("loans.newLoan") }) })
      ] }),
      borrower.loans.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-400", children: t("loans.noLoans") }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: borrower.loans.map((loan) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/loans/$loanId", params: {
        loanId: loan.id
      }, className: "flex items-center justify-between rounded-lg border border-slate-100 p-3 hover:bg-slate-50 transition-colors", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-bold text-slate-400 tabular-nums", children: [
              "#",
              loan.loanNumber
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CurrencyDisplay, { amount: parseFloat(loan.primaryAmount), className: "font-semibold text-slate-900" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400", children: loan.dateGiven })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { status: loan.status, children: loan.status })
      ] }, loan.id)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(MagicLinkGenerator, { borrowerId: borrower.id, portalToken: borrower.portalToken }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "mb-3", children: t("borrowers.stepPhotos") }),
      (borrower.profilePhotoUrl || borrower.aadhaarPhotoUrl) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3 mb-4", children: [
        borrower.profilePhotoUrl && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500 mb-1", children: t("borrowers.profilePhoto") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: borrower.profilePhotoUrl, alt: t("borrowers.profilePhoto"), className: "w-full rounded-lg object-cover aspect-square" })
        ] }),
        borrower.aadhaarPhotoUrl && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500 mb-1", children: t("borrowers.aadhaarPhoto") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: borrower.aadhaarPhotoUrl, alt: t("borrowers.aadhaarPhoto"), className: "w-full rounded-lg object-cover aspect-square" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DocumentUpload, { borrowerId: borrower.id, onProfilePhoto: () => fetchBorrower(), onAadhaarPhoto: () => fetchBorrower() })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: editOpen, onClose: () => setEditOpen(false), title: t("borrowers.editBorrower"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(BorrowerForm, { initialData: {
      name: borrower.name,
      mobile: borrower.mobile,
      area: borrower.area ?? "",
      address: borrower.address ?? "",
      locationUrl: borrower.locationLat && borrower.locationLng ? `https://www.google.com/maps?q=${borrower.locationLat},${borrower.locationLng}` : "",
      locationLat: borrower.locationLat ? Number(borrower.locationLat) : null,
      locationLng: borrower.locationLng ? Number(borrower.locationLng) : null,
      suretyType: borrower.suretyType ?? "owner",
      suretyReferenceId: borrower.suretyReferenceId ?? ""
    }, onSubmit: handleUpdate, loading: saving }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Modal, { isOpen: deleteOpen, onClose: () => setDeleteOpen(false), title: t("borrowers.deleteBorrower"), size: "sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-600 mb-6", children: t("borrowers.confirmDelete") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", className: "flex-1", onClick: () => setDeleteOpen(false), children: t("common.cancel") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "danger", className: "flex-1", onClick: handleDelete, loading: deleting, children: t("common.delete") })
      ] })
    ] })
  ] });
}
export {
  BorrowerDetailPage as component
};
