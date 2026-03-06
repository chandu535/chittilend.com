import { r as reactExports, j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { I as Input } from "./Input-CQaLwuWI.mjs";
import { S as Select } from "./Select-tn0N3Klx.mjs";
import { B as Button } from "./router-De5441r5.mjs";
import { N as NameDisplay } from "./NameDisplay-B-OL-WuP.mjs";
import { s as searchBorrowers } from "./borrowers-C0dlCdLt.mjs";
import { u as useTranslation } from "../_libs/react-i18next.mjs";
function BorrowerForm({ initialData, onSubmit, loading, submitLabel }) {
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
    /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", className: "w-full", loading, children: submitLabel || t("common.save") })
  ] });
}
export {
  BorrowerForm as B
};
