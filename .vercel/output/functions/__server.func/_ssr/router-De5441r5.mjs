import { E as redirect } from "../_chunks/_libs/@tanstack/router-core.mjs";
import { c as createRouter, a as createRootRoute, b as createFileRoute, l as lazyRouteComponent, O as Outlet, H as HeadContent, S as Scripts } from "../_chunks/_libs/@tanstack/react-router.mjs";
import { r as reactExports, j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { S as Store } from "../_chunks/_libs/@tanstack/store.mjs";
import { u as useStore } from "../_chunks/_libs/@tanstack/react-store.mjs";
import { c as clsx } from "../_libs/clsx.mjs";
import { i as instance } from "../_libs/i18next.mjs";
import { c as createServerFn, T as TSS_SERVER_FUNCTION, g as getServerFnById } from "./index.mjs";
import { l as loginSchema } from "./auth-CwIywibs.mjs";
import { i as initReactI18next, u as useTranslation } from "../_libs/react-i18next.mjs";
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
import "../_libs/use-sync-external-store.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "../_libs/joi.mjs";
import "../_chunks/_libs/@hapi/hoek.mjs";
import "../_chunks/_libs/@hapi/formula.mjs";
import "../_chunks/_libs/@hapi/pinpoint.mjs";
import "../_chunks/_libs/@hapi/topo.mjs";
import "../_chunks/_libs/@hapi/address.mjs";
import "url";
import "../_chunks/_libs/@hapi/tlds.mjs";
const authStore = new Store({
  user: null,
  isAuthenticated: false
});
const uiStore = new Store({
  language: "en",
  useNativeNumerals: false,
  sidebarOpen: false,
  activeFilters: {
    loanStatus: "all",
    dateRange: "thisMonth",
    area: "all"
  }
});
const LANG_COOKIE = "chittilend-lang";
function setLanguage(lang) {
  uiStore.setState((s) => ({ ...s, language: lang }));
  if (typeof window !== "undefined") {
    localStorage.setItem(LANG_COOKIE, lang);
    document.cookie = `${LANG_COOKIE}=${lang};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
    document.documentElement.setAttribute("lang", lang);
  }
}
function setAuthUser(user) {
  authStore.setState(() => ({
    user,
    isAuthenticated: user !== null
  }));
}
const typeStyles = {
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  error: "bg-red-50 border-red-200 text-red-800",
  info: "bg-blue-50 border-blue-200 text-blue-800"
};
const icons = {
  success: "✓",
  error: "✗",
  info: "ℹ"
};
let addToastExternal = null;
function toast(message, type = "info") {
  addToastExternal?.(message, type);
}
function ToastContainer() {
  const [toasts, setToasts] = reactExports.useState([]);
  const addToast = reactExports.useCallback((message, type) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);
  const removeToast = reactExports.useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  reactExports.useEffect(() => {
    addToastExternal = addToast;
    return () => {
      addToastExternal = null;
    };
  }, [addToast]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none", children: toasts.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx(ToastItem, { toast: t, onDismiss: removeToast }, t.id)) });
}
function ToastItem({ toast: t, onDismiss }) {
  reactExports.useEffect(() => {
    const timer = setTimeout(() => onDismiss(t.id), 4e3);
    return () => clearTimeout(timer);
  }, [t.id, onDismiss]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: clsx(
        "pointer-events-auto flex items-center gap-2 rounded-lg border px-4 py-3 shadow-md",
        "animate-[slideIn_0.2s_ease-out]",
        typeStyles[t.type]
      ),
      role: "alert",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg font-bold", children: icons[t.type] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium flex-1", children: t.message }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => onDismiss(t.id),
            className: "text-current opacity-50 hover:opacity-100 min-h-[44px] min-w-[44px] flex items-center justify-center",
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
      ]
    }
  );
}
const variantStyles = {
  primary: "bg-primary text-white hover:bg-blue-700 focus:ring-blue-300",
  secondary: "bg-secondary text-white hover:bg-violet-700 focus:ring-violet-300",
  danger: "bg-danger text-white hover:bg-red-700 focus:ring-red-300",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-200"
};
const sizeStyles = {
  sm: "px-3 py-1.5 text-sm min-h-[36px]",
  md: "px-4 py-2.5 text-sm min-h-[44px]",
  lg: "px-6 py-3 text-base min-h-[48px]"
};
function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      className: clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium",
        "transition-colors focus:outline-none focus:ring-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className
      ),
      disabled: disabled || loading,
      ...props,
      children: [
        loading && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "svg",
          {
            className: "h-4 w-4 animate-spin",
            viewBox: "0 0 24 24",
            fill: "none",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "circle",
                {
                  className: "opacity-25",
                  cx: "12",
                  cy: "12",
                  r: "10",
                  stroke: "currentColor",
                  strokeWidth: "4"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "path",
                {
                  className: "opacity-75",
                  fill: "currentColor",
                  d: "M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                }
              )
            ]
          }
        ),
        children
      ]
    }
  );
}
class ErrorBoundary extends reactExports.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center min-h-[200px] p-6 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-12 w-12 text-slate-300 mb-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.5, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-slate-700", children: "Something went wrong" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-500", children: this.state.error?.message || "An unexpected error occurred" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "secondary",
            size: "sm",
            className: "mt-4",
            onClick: () => this.setState({ hasError: false, error: null }),
            children: "Try again"
          }
        )
      ] });
    }
    return this.props.children;
  }
}
const common$1 = { "appName": "ChittiLend", "save": "Save", "cancel": "Cancel", "delete": "Delete", "edit": "Edit", "search": "Search", "filter": "Filter", "loading": "Loading...", "noData": "No data found", "confirm": "Confirm", "back": "Back", "next": "Next", "submit": "Submit", "close": "Close", "yes": "Yes", "no": "No", "all": "All", "viewAll": "View All", "actions": "Actions", "status": "Status", "date": "Date", "amount": "Amount", "notes": "Notes", "required": "Required" };
const nav$1 = { "home": "Home", "dashboard": "Dashboard", "loans": "Loans", "newLoan": "New Loan", "borrowers": "Borrowers", "payments": "Payments", "analytics": "Analytics", "settings": "Settings", "capital": "Capital Pool", "logout": "Logout" };
const auth$1 = { "login": "Login", "email": "Email", "password": "Password", "loginTitle": "Sign In", "loginSubtitle": "Manage your chitti lending business", "loginButton": "Sign In", "emailPlaceholder": "admin@chittilend.com", "passwordPlaceholder": "Enter your password", "loginError": "Invalid email or password", "welcomeBack": "Welcome back" };
const dashboard$1 = { "title": "Dashboard", "subtitle": "Overview of your lending business", "totalDeployed": "Total Deployed", "availableCapital": "Available Capital", "toCollect": "To Collect", "profitEarned": "Profit Earned", "activeLoans": "Active Loans", "overduePayments": "Overdue Payments", "thisMonthCollected": "This Month Collected", "thisMonthGiven": "This Month Given", "recentActivity": "Recent Activity", "quickActions": "Quick Actions", "overdueAlert": "{{count, number}} payments are overdue!", "overdueAlert_one": "{{count, number}} payment is overdue!", "noOverdue": "All payments on track" };
const loans$1 = { "title": "Loans", "createTitle": "New Loan", "newLoan": "New Loan", "loanDetails": "Loan Details", "primaryAmount": "Primary Amount", "amountReceived": "Amount Received", "serviceCharge": "Service Charge", "totalRepayment": "Total Repayment", "tenure": "Tenure", "months": "months", "weeks": "weeks", "installment": "Installment", "perMonth": "per month", "perWeek": "per week", "frequency": "Payment Frequency", "monthly": "Monthly", "weekly": "Weekly", "dateGiven": "Date Given", "startMonth": "Start Month", "profit": "Profit", "remaining": "Remaining", "progress": "{{paid, number}} of {{total, number}} paid", "statusActive": "Active", "statusCompleted": "Completed", "statusDefaulted": "Defaulted", "statusExtended": "Extended", "selectBorrower": "Select Borrower", "enterAmount": "Enter Amount", "reviewSchedule": "Review Schedule", "uploadProof": "Upload Proof", "confirmCreate": "Confirm & Create", "autoCalcHint": "Enter the primary amount — everything else calculates automatically", "extendTenure": "Extend Tenure", "newTenure": "New Tenure (months)", "noLoans": "No loans yet. Create your first loan!", "loans_count_one": "{{count, number}} Loan", "loans_count_other": "{{count, number}} Loans" };
const payments$1 = { "title": "Payments", "upcoming": "Upcoming", "overdue": "Overdue", "recent": "Recent", "markPaid": "Mark Paid", "markPartial": "Mark Partial", "markWaived": "Waive", "paid": "Paid", "pending": "Pending", "partial": "Partial", "waived": "Waived", "dueDate": "Due Date", "paidDate": "Paid Date", "amountDue": "Amount Due", "amountPaid": "Amount Paid", "installmentNo": "Installment #{{number, number}}", "paymentMethod": "Payment Method", "cash": "Cash", "upi": "UPI", "bankTransfer": "Bank Transfer", "other": "Other", "waiverReason": "Reason for waiver", "confirmPayment": "Confirm Payment", "noUpcoming": "No upcoming payments this week.", "noOverdue": "No overdue payments.", "payments_count_one": "{{count, number}} Payment", "payments_count_other": "{{count, number}} Payments", "revertPayment": "Revert Payment", "revertConfirm": "Are you sure you want to revert this payment? The amount will be removed from collections.", "revertReason": "Reason for reversal", "revertSuccess": "Payment reverted successfully", "alreadyPending": "This payment is already pending" };
const borrowers$1 = { "title": "Borrowers", "newBorrower": "New Borrower", "name": "Name", "mobile": "Mobile Number", "mobileHint": "10 digits only (no +91)", "area": "Area", "address": "Address", "location": "Location", "aadhaarPhoto": "Aadhaar Photo", "profilePhoto": "Photo", "surety": "Surety", "suretyOwner": "Owner", "suretyExisting": "Existing Borrower", "suretyReference": "Surety Reference", "magicLink": "Access Link", "generateLink": "Generate Link", "copyLink": "Copy Link", "linkCopied": "Link copied!", "activeLoans": "Active Loans", "totalBorrowed": "Total Borrowed", "capturePhoto": "Capture Photo", "uploadPhoto": "Upload Photo", "locationAuto": "Location captured automatically", "locationManual": "Enter location manually", "noBorrowers": "No borrowers yet. Add your first borrower!", "stepDetails": "Details", "stepPhotos": "Photos", "stepDetailsDesc": "Enter borrower information", "stepPhotosDesc": "Take a photo and upload Aadhaar", "createSuccess": "Borrower created successfully", "editBorrower": "Edit Borrower", "deleteBorrower": "Delete Borrower", "confirmDelete": "Are you sure you want to delete this borrower? This action cannot be undone.", "deleteSuccess": "Borrower deleted successfully", "updateSuccess": "Borrower updated successfully", "hasActiveLoans": "Cannot delete borrower with active loans" };
const analytics$1 = { "title": "Analytics", "thisWeek": "This Week", "thisMonth": "This Month", "thisYear": "This Year", "custom": "Custom Range", "from": "From", "to": "To", "apply": "Apply", "collections": "Collections", "disbursements": "Disbursements", "netFlow": "Net Cash Flow", "areaBreakdown": "Area Breakdown", "borrowerStats": "Borrower Stats", "loanStatus": "Loan Status Distribution", "capitalFlow": "Capital Flow", "monthlyComparison": "Monthly Comparison", "reliability": "Reliability", "onTimeRate": "On-Time Rate", "totalLoans": "Total Loans", "amountGiven": "Amount Given", "amountCollected": "Amount Collected", "amountPending": "Amount Pending", "profitRealized": "Profit Realized", "uniqueCapital": "Unique Capital Invested", "totalCirculated": "Total Capital Circulated", "noData": "No data for this period." };
const capital$1 = { "title": "Capital Pool", "balance": "Current Balance", "addInvestment": "Add Investment", "investmentAmount": "Investment Amount", "log": "Capital Log", "investment": "Investment", "collection": "Collection", "disbursement": "Disbursement" };
const portal$1 = { "welcome": "Welcome, {{name}}", "yourLoans": "Your Loans", "paymentSchedule": "Payment Schedule", "totalRemaining": "Total Remaining", "nextDue": "Next Due", "noDue": "No payments due", "allPaid": "All payments completed! Thank you." };
const settings$1 = { "title": "Settings", "managers": "Manager Accounts", "addManager": "Add Manager", "managerName": "Manager Name", "managerEmail": "Manager Email", "managerPassword": "Temporary Password", "deactivate": "Deactivate", "activate": "Activate" };
const time$1 = { "today": "Today", "yesterday": "Yesterday", "tomorrow": "Tomorrow", "thisWeek": "This Week", "lastWeek": "Last Week", "thisMonth": "This Month", "lastMonth": "Last Month" };
const units$1 = { "months_one": "{{count, number}} month", "months_other": "{{count, number}} months", "weeks_one": "{{count, number}} week", "weeks_other": "{{count, number}} weeks", "days_one": "{{count, number}} day", "days_other": "{{count, number}} days", "rupees": "Rupees", "perMonth": "per month", "perWeek": "per week" };
const greeting$1 = { "morning": "Good morning", "afternoon": "Good afternoon", "evening": "Good evening" };
const accessibility$1 = { "languageSwitch": "Switch to Telugu", "currentLanguage": "English", "menuOpen": "Open menu", "menuClose": "Close menu" };
const errors$1 = { "generic": "Something went wrong. Please try again.", "unauthorized": "You are not authorized to do this.", "notFound": "Not found.", "mobileExists": "This mobile number is already registered.", "invalidToken": "This link is invalid or has expired.", "networkError": "Network error. Check your connection." };
const en = {
  common: common$1,
  nav: nav$1,
  auth: auth$1,
  dashboard: dashboard$1,
  loans: loans$1,
  payments: payments$1,
  borrowers: borrowers$1,
  analytics: analytics$1,
  capital: capital$1,
  portal: portal$1,
  settings: settings$1,
  time: time$1,
  units: units$1,
  greeting: greeting$1,
  accessibility: accessibility$1,
  errors: errors$1
};
const common = { "appName": "చిట్టీలెండ్", "save": "సేవ్ చేయండి", "cancel": "రద్దు చేయండి", "delete": "తొలగించండి", "edit": "సవరించండి", "search": "శోధించండి", "filter": "ఫిల్టర్", "loading": "లోడ్ అవుతోంది...", "noData": "డేటా కనుగొనబడలేదు", "confirm": "నిర్ధారించండి", "back": "వెనుకకు", "next": "తదుపరి", "submit": "సమర్పించండి", "close": "మూసివేయండి", "yes": "అవును", "no": "కాదు", "all": "అన్ని", "viewAll": "అన్నీ చూడండి", "actions": "చర్యలు", "status": "స్థితి", "date": "తేదీ", "amount": "మొత్తం", "notes": "గమనికలు", "required": "తప్పనిసరి" };
const nav = { "home": "హోమ్", "dashboard": "డ్యాష్‌బోర్డ్", "loans": "అప్పులు", "newLoan": "కొత్త అప్పు", "borrowers": "అప్పుదారులు", "payments": "చెల్లింపులు", "analytics": "విశ్లేషణలు", "settings": "సెట్టింగ్‌లు", "capital": "మూలధన నిధి", "logout": "లాగ్ అవుట్" };
const auth = { "login": "లాగిన్", "email": "ఈమెయిల్", "password": "పాస్‌వర్డ్", "loginTitle": "సైన్ ఇన్", "loginSubtitle": "మీ చిట్టీ అప్పుల వ్యాపారాన్ని నిర్వహించండి", "loginButton": "సైన్ ఇన్", "emailPlaceholder": "admin@chittilend.com", "passwordPlaceholder": "మీ పాస్‌వర్డ్ ఇవ్వండి", "loginError": "చెల్లని ఈమెయిల్ లేదా పాస్‌వర్డ్", "welcomeBack": "మళ్ళీ స్వాగతం" };
const dashboard = { "title": "డ్యాష్‌బోర్డ్", "subtitle": "మీ అప్పుల వ్యాపార సారాంశం", "totalDeployed": "మొత్తం ఇచ్చిన మొత్తం", "availableCapital": "అందుబాటులో ఉన్న మూలధనం", "toCollect": "వసూలు చేయవలసినది", "profitEarned": "సంపాదించిన లాభం", "activeLoans": "చురుకైన అప్పులు", "overduePayments": "గడువు మీరిన చెల్లింపులు", "thisMonthCollected": "ఈ నెల వసూలు", "thisMonthGiven": "ఈ నెల ఇచ్చినది", "recentActivity": "ఇటీవలి కార్యకలాపాలు", "quickActions": "త్వరిత చర్యలు", "overdueAlert": "{{count, number}} చెల్లింపులు గడువు మీరాయి!", "overdueAlert_one": "{{count, number}} చెల్లింపు గడువు మీరింది!", "noOverdue": "అన్ని చెల్లింపులు సకాలంలో" };
const loans = { "title": "అప్పులు", "createTitle": "కొత్త అప్పు", "newLoan": "కొత్త అప్పు", "loanDetails": "అప్పు వివరాలు", "primaryAmount": "ప్రాథమిక మొత్తం", "amountReceived": "అందుకున్న మొత్తం", "serviceCharge": "సేవా రుసుము", "totalRepayment": "మొత్తం తిరిగి చెల్లింపు", "tenure": "వ్యవధి", "months": "నెలలు", "weeks": "వారాలు", "installment": "వాయిదా", "perMonth": "నెలకు", "perWeek": "వారానికి", "frequency": "చెల్లింపు ఫ్రీక్వెన్సీ", "monthly": "నెలవారీ", "weekly": "వారవారీ", "dateGiven": "ఇచ్చిన తేదీ", "startMonth": "ప్రారంభ నెల", "profit": "లాభం", "remaining": "మిగిలినది", "progress": "{{total, number}} లో {{paid, number}} చెల్లించారు", "statusActive": "చురుకైన", "statusCompleted": "పూర్తయింది", "statusDefaulted": "ఎగవేసింది", "statusExtended": "పొడిగించబడింది", "selectBorrower": "అప్పుదారుని ఎంచుకోండి", "enterAmount": "మొత్తం నమోదు చేయండి", "reviewSchedule": "షెడ్యూల్ సమీక్షించండి", "uploadProof": "రుజువు అప్‌లోడ్ చేయండి", "confirmCreate": "నిర్ధారించి సృష్టించండి", "autoCalcHint": "ప్రాథమిక మొత్తం నమోదు చేయండి — మిగతా అన్నీ ఆటోమేటిగ్గా లెక్కించబడతాయి", "extendTenure": "వ్యవధి పొడిగించండి", "newTenure": "కొత్త వ్యవధి (నెలలు)", "noLoans": "ఇంకా అప్పులు లేవు. మీ మొదటి అప్పు సృష్టించండి!", "loans_count_one": "{{count, number}} అప్పు", "loans_count_other": "{{count, number}} అప్పులు" };
const payments = { "title": "చెల్లింపులు", "upcoming": "రాబోయేవి", "overdue": "గడువు మీరినవి", "recent": "ఇటీవలివి", "markPaid": "చెల్లించినట్లు గుర్తించు", "markPartial": "పాక్షిక చెల్లింపు", "markWaived": "మాఫీ చేయు", "paid": "చెల్లించారు", "pending": "పెండింగ్", "partial": "పాక్షికం", "waived": "మాఫీ", "dueDate": "గడువు తేదీ", "paidDate": "చెల్లించిన తేదీ", "amountDue": "చెల్లించవలసిన మొత్తం", "amountPaid": "చెల్లించిన మొత్తం", "installmentNo": "వాయిదా #{{number, number}}", "paymentMethod": "చెల్లింపు విధానం", "cash": "నగదు", "upi": "యూపీఐ", "bankTransfer": "బ్యాంక్ బదిలీ", "other": "ఇతర", "waiverReason": "మాఫీ కారణం", "confirmPayment": "చెల్లింపు నిర్ధారించండి", "noUpcoming": "ఈ వారం రాబోయే చెల్లింపులు లేవు.", "noOverdue": "గడువు మీరిన చెల్లింపులు లేవు.", "payments_count_one": "{{count, number}} చెల్లింపు", "payments_count_other": "{{count, number}} చెల్లింపులు", "revertPayment": "చెల్లింపు రద్దు", "revertConfirm": "మీరు ఈ చెల్లింపును రద్దు చేయాలనుకుంటున్నారా? మొత్తం వసూళ్ళ నుండి తొలగించబడుతుంది.", "revertReason": "రద్దు కారణం", "revertSuccess": "చెల్లింపు విజయవంతంగా రద్దు చేయబడింది", "alreadyPending": "ఈ చెల్లింపు ఇప్పటికే పెండింగ్‌లో ఉంది" };
const borrowers = { "title": "అప్పుదారులు", "newBorrower": "కొత్త అప్పుదారు", "name": "పేరు", "mobile": "మొబైల్ నంబర్", "mobileHint": "10 అంకెలు మాత్రమే (+91 లేకుండా)", "area": "ప్రాంతం", "address": "చిరునామా", "location": "లొకేషన్", "aadhaarPhoto": "ఆధార్ ఫోటో", "profilePhoto": "ఫోటో", "surety": "జామీను", "suretyOwner": "యజమాని", "suretyExisting": "ఇప్పటికే ఉన్న అప్పుదారు", "suretyReference": "జామీను రిఫరెన్స్", "magicLink": "యాక్సెస్ లింక్", "generateLink": "లింక్ జనరేట్ చేయండి", "copyLink": "లింక్ కాపీ చేయండి", "linkCopied": "లింక్ కాపీ అయింది!", "activeLoans": "చురుకైన అప్పులు", "totalBorrowed": "మొత్తం అప్పు", "capturePhoto": "ఫోటో తీయండి", "uploadPhoto": "ఫోటో అప్‌లోడ్ చేయండి", "locationAuto": "లొకేషన్ ఆటోమేటిగ్గా తీసుకోబడింది", "locationManual": "లొకేషన్ మాన్యువల్‌గా నమోదు చేయండి", "noBorrowers": "ఇంకా అప్పుదారులు లేరు. మీ మొదటి అప్పుదారుని జోడించండి!", "stepDetails": "వివరాలు", "stepPhotos": "ఫోటోలు", "stepDetailsDesc": "అప్పుదారు సమాచారం నమోదు చేయండి", "stepPhotosDesc": "ఫోటో తీసి ఆధార్ అప్‌లోడ్ చేయండి", "createSuccess": "అప్పుదారు విజయవంతంగా సృష్టించబడ్డారు", "editBorrower": "అప్పుదారుని మార్చు", "deleteBorrower": "అప్పుదారుని తొలగించు", "confirmDelete": "మీరు ఈ అప్పుదారుని తొలగించాలనుకుంటున్నారా? ఈ చర్యను రద్దు చేయలేరు.", "deleteSuccess": "అప్పుదారు విజయవంతంగా తొలగించబడ్డారు", "updateSuccess": "అప్పుదారు విజయవంతంగా నవీకరించబడ్డారు", "hasActiveLoans": "చురుకైన అప్పులు ఉన్న అప్పుదారుని తొలగించలేరు" };
const analytics = { "title": "విశ్లేషణలు", "thisWeek": "ఈ వారం", "thisMonth": "ఈ నెల", "thisYear": "ఈ సంవత్సరం", "custom": "కస్టమ్ రేంజ్", "from": "నుండి", "to": "వరకు", "apply": "వర్తింపజేయండి", "collections": "వసూళ్ళు", "disbursements": "చెల్లింపులు", "netFlow": "నికర నగదు ప్రవాహం", "areaBreakdown": "ప్రాంతం వారీ విభజన", "borrowerStats": "అప్పుదారుల గణాంకాలు", "loanStatus": "అప్పు స్థితి పంపిణీ", "capitalFlow": "మూలధన ప్రవాహం", "monthlyComparison": "నెలవారీ పోలిక", "reliability": "నమ్మకత్వం", "onTimeRate": "సకాలంలో రేటు", "totalLoans": "మొత్తం అప్పులు", "amountGiven": "ఇచ్చిన మొత్తం", "amountCollected": "వసూలు చేసిన మొత్తం", "amountPending": "పెండింగ్ మొత్తం", "profitRealized": "సాధించిన లాభం", "uniqueCapital": "ప్రత్యేక మూలధన పెట్టుబడి", "totalCirculated": "మొత్తం చలామణి మూలధనం", "noData": "ఈ కాలానికి డేటా లేదు." };
const capital = { "title": "మూలధన నిధి", "balance": "ప్రస్తుత బ్యాలెన్స్", "addInvestment": "పెట్టుబడి జోడించండి", "investmentAmount": "పెట్టుబడి మొత్తం", "log": "మూలధన లాగ్", "investment": "పెట్టుబడి", "collection": "వసూలు", "disbursement": "చెల్లింపు" };
const portal = { "welcome": "స్వాగతం, {{name}}", "yourLoans": "మీ అప్పులు", "paymentSchedule": "చెల్లింపు షెడ్యూల్", "totalRemaining": "మొత్తం మిగిలినది", "nextDue": "తదుపరి గడువు", "noDue": "చెల్లింపులు లేవు", "allPaid": "అన్ని చెల్లింపులు పూర్తయ్యాయి! ధన్యవాదాలు." };
const settings = { "title": "సెట్టింగ్‌లు", "managers": "మేనేజర్ ఖాతాలు", "addManager": "మేనేజర్ జోడించండి", "managerName": "మేనేజర్ పేరు", "managerEmail": "మేనేజర్ ఈమెయిల్", "managerPassword": "తాత్కాలిక పాస్‌వర్డ్", "deactivate": "నిష్క్రియం చేయండి", "activate": "సక్రియం చేయండి" };
const time = { "today": "ఈ రోజు", "yesterday": "నిన్న", "tomorrow": "రేపు", "thisWeek": "ఈ వారం", "lastWeek": "గత వారం", "thisMonth": "ఈ నెల", "lastMonth": "గత నెల" };
const units = { "months_one": "{{count, number}} నెల", "months_other": "{{count, number}} నెలలు", "weeks_one": "{{count, number}} వారం", "weeks_other": "{{count, number}} వారాలు", "days_one": "{{count, number}} రోజు", "days_other": "{{count, number}} రోజులు", "rupees": "రూపాయలు", "perMonth": "నెలకు", "perWeek": "వారానికి" };
const greeting = { "morning": "శుభోదయం", "afternoon": "శుభ మధ్యాహ్నం", "evening": "శుభ సాయంత్రం" };
const accessibility = { "languageSwitch": "ఆంగ్లంలోకి మార్చండి", "currentLanguage": "తెలుగు", "menuOpen": "మెనూ తెరవండి", "menuClose": "మెనూ మూసివేయండి" };
const errors = { "generic": "ఏదో తప్పు జరిగింది. దయచేసి మళ్ళీ ప్రయత్నించండి.", "unauthorized": "దీన్ని చేయడానికి మీకు అధికారం లేదు.", "notFound": "కనుగొనబడలేదు.", "mobileExists": "ఈ మొబైల్ నంబర్ ఇప్పటికే నమోదు చేయబడింది.", "invalidToken": "ఈ లింక్ చెల్లదు లేదా గడువు ముగిసింది.", "networkError": "నెట్‌వర్క్ లోపం. మీ కనెక్షన్ తనిఖీ చేయండి." };
const te = {
  common,
  nav,
  auth,
  dashboard,
  loans,
  payments,
  borrowers,
  analytics,
  capital,
  portal,
  settings,
  time,
  units,
  greeting,
  accessibility,
  errors
};
instance.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    te: { translation: te }
  },
  lng: "en",
  fallbackLng: "en",
  supportedLngs: ["en", "te"],
  interpolation: {
    escapeValue: false,
    format: (value, format, lng) => {
      if (typeof value !== "number") return String(value);
      const locale = lng === "te" ? "te-IN" : "en-IN";
      const ns = "latn";
      if (format === "number") {
        return new Intl.NumberFormat(locale, { numberingSystem: ns }).format(value);
      }
      if (format === "currency") {
        return new Intl.NumberFormat(locale, {
          style: "currency",
          currency: "INR",
          numberingSystem: ns,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value);
      }
      if (format === "percent") {
        return new Intl.NumberFormat(locale, {
          style: "percent",
          numberingSystem: ns,
          minimumFractionDigits: 0,
          maximumFractionDigits: 1
        }).format(value / 100);
      }
      return new Intl.NumberFormat(locale, { numberingSystem: ns }).format(value);
    }
  },
  react: {
    useSuspense: true
  }
});
const appCss = "/assets/styles-v7XWmTwv.css";
const Route$f = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
      { name: "theme-color", content: "#2563EB" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "description", content: "ChittiLend — Manage chitti lending operations" },
      { title: "ChittiLend" }
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "apple-touch-icon", href: "/logo192.png" }
    ]
  }),
  component: RootComponent
});
function RootComponent() {
  const { i18n: i18n2 } = useTranslation();
  reactExports.useEffect(() => {
    const saved = localStorage.getItem(LANG_COOKIE);
    if (saved === "te" || saved === "en") {
      setLanguage(saved);
      i18n2.changeLanguage(saved);
    }
  }, [i18n2]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(RootDocument, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(ErrorBoundary, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ToastContainer, {})
  ] });
}
function RootDocument({ children }) {
  const language = useStore(uiStore, (s) => s.language);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("html", { lang: language, suppressHydrationWarning: true, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("head", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("body", { className: "font-sans antialiased", children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(Scripts, {})
    ] })
  ] });
}
const $$splitComponentImporter$d = () => import("./login-CHwUUCle.mjs");
const Route$e = createFileRoute("/login")({
  component: lazyRouteComponent($$splitComponentImporter$d, "component")
});
const createSsrRpc = (functionId, importer) => {
  const url = "/_serverFn/" + functionId;
  const serverFnMeta = { id: functionId };
  const fn = async (...args) => {
    const serverFn = await getServerFnById(functionId);
    return serverFn(...args);
  };
  return Object.assign(fn, {
    url,
    serverFnMeta,
    [TSS_SERVER_FUNCTION]: true
  });
};
const login = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const {
    error,
    value
  } = loginSchema.validate(data, {
    abortEarly: false
  });
  if (error) {
    const messages = error.details.map((d) => d.message).join(", ");
    throw new Error(messages);
  }
  return value;
}).handler(createSsrRpc("c66295356ee1bed9dcd6acc6996417714105d1c255d6dc117cb348c4624a9cfa"));
const logout = createServerFn({
  method: "POST"
}).handler(createSsrRpc("29fdd7534a8fc4cc73a2fc0e6a37abee71570be1256a0cd8b872f6c5140c326e"));
const getSession = createServerFn({
  method: "GET"
}).handler(createSsrRpc("bf7d44565f0a75f8775052ea39a4b3599b3e66c0d477bc07f07917b7fb9585ca"));
createServerFn({
  method: "GET"
}).inputValidator((data) => {
  const token = data.token;
  if (!token || typeof token !== "string" || token.length !== 64) {
    throw new Error("Invalid portal token");
  }
  return {
    token
  };
}).handler(createSsrRpc("8829a2c83808fdbc570343dfba48bb912c280a25f1e33ff0d12598054a2751a2"));
const $$splitComponentImporter$c = () => import("./_authenticated-CuHTe5T7.mjs");
const Route$d = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    const {
      user
    } = await getSession();
    if (!user) {
      throw redirect({
        to: "/login"
      });
    }
    return {
      user
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$c, "component")
});
const Route$c = createFileRoute("/")({
  beforeLoad: async () => {
    const { user } = await getSession();
    if (user) {
      throw redirect({ to: "/dashboard" });
    } else {
      throw redirect({ to: "/login" });
    }
  }
});
const getPortalData = createServerFn({
  method: "GET"
}).inputValidator((data) => {
  const token = data.token;
  if (!token || typeof token !== "string") {
    throw new Error("Invalid portal token");
  }
  return {
    token
  };
}).handler(createSsrRpc("19c53245c787054aa8380a119cf8051162f8b3ea34375828992f42047dbe4e46"));
const $$splitComponentImporter$b = () => import("./_token-C-Nm6CE2.mjs");
const Route$b = createFileRoute("/portal/$token")({
  component: lazyRouteComponent($$splitComponentImporter$b, "component")
});
const $$splitComponentImporter$a = () => import("./settings-B2veuC3R.mjs");
const Route$a = createFileRoute("/_authenticated/settings")({
  component: lazyRouteComponent($$splitComponentImporter$a, "component")
});
const $$splitComponentImporter$9 = () => import("./payments-DrLI6N2_.mjs");
const Route$9 = createFileRoute("/_authenticated/payments")({
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const getDashboardSummary = createServerFn({
  method: "GET"
}).handler(createSsrRpc("86137142a74d80357aac4d577d75d056d30cd47b41a4a6566b21623b672b5b1e"));
const getCashflowTimeline = createServerFn({
  method: "GET"
}).inputValidator((data) => {
  const input = data;
  const now = /* @__PURE__ */ new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  return {
    dateFrom: input.dateFrom || sixMonthsAgo.toISOString().split("T")[0],
    dateTo: input.dateTo || now.toISOString().split("T")[0]
  };
}).handler(createSsrRpc("21372f13675cb16fef1a6a80ea212d700ad9e6d25ba796aa09565aef12f5cbe7"));
const getAreaBreakdown = createServerFn({
  method: "GET"
}).inputValidator((data) => {
  const input = data;
  return {
    dateFrom: input.dateFrom || null,
    dateTo: input.dateTo || null
  };
}).handler(createSsrRpc("6545723090aa22a2c36a2643951f144b7b594339e32a0728c055a08805363cae"));
const getBorrowerRanking = createServerFn({
  method: "GET"
}).handler(createSsrRpc("659dadff243a85a5bac6d9206571e508b15d4876047c9dc57011f252f79ff484"));
const getStatusDistribution = createServerFn({
  method: "GET"
}).handler(createSsrRpc("3e9c2c0571901ffe57141eacf53b8ed8d92472b720c79109737bf5aa8f528922"));
const getMonthlySnapshot = createServerFn({
  method: "GET"
}).inputValidator((data) => {
  const input = data;
  return {
    month: input.month,
    year: input.year
  };
}).handler(createSsrRpc("dbd9f7730ebad79ea4ce6669df1e8129b72f2cacf83639e4d70a092dbc83e880"));
const getRecentActivity = createServerFn({
  method: "GET"
}).handler(createSsrRpc("e9a4555d7c844d233b99e27d25f094e7df13d73cd7572c2b83920784810d6748"));
const $$splitComponentImporter$8 = () => import("./dashboard-B7bhAplr.mjs");
const Route$8 = createFileRoute("/_authenticated/dashboard")({
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const $$splitComponentImporter$7 = () => import("./capital-DXNEque6.mjs");
const Route$7 = createFileRoute("/_authenticated/capital")({
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./analytics-DQY3XW7U.mjs");
const Route$6 = createFileRoute("/_authenticated/analytics")({
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./index-Cm61_jqg.mjs");
const Route$5 = createFileRoute("/_authenticated/loans/")({
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./index-CKNwN4uu.mjs");
const Route$4 = createFileRoute("/_authenticated/borrowers/")({
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./new-CU5TPhT7.mjs");
const Route$3 = createFileRoute("/_authenticated/loans/new")({
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./_loanId-DecG3Jhq.mjs");
const Route$2 = createFileRoute("/_authenticated/loans/$loanId")({
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./new-Bf4rvC4l.mjs");
const Route$1 = createFileRoute("/_authenticated/borrowers/new")({
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./_borrowerId-D2Jhaw5w.mjs");
const Route = createFileRoute("/_authenticated/borrowers/$borrowerId")({
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const LoginRoute = Route$e.update({
  id: "/login",
  path: "/login",
  getParentRoute: () => Route$f
});
const AuthenticatedRoute = Route$d.update({
  id: "/_authenticated",
  getParentRoute: () => Route$f
});
const IndexRoute = Route$c.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$f
});
const PortalTokenRoute = Route$b.update({
  id: "/portal/$token",
  path: "/portal/$token",
  getParentRoute: () => Route$f
});
const AuthenticatedSettingsRoute = Route$a.update({
  id: "/settings",
  path: "/settings",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedPaymentsRoute = Route$9.update({
  id: "/payments",
  path: "/payments",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedDashboardRoute = Route$8.update({
  id: "/dashboard",
  path: "/dashboard",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedCapitalRoute = Route$7.update({
  id: "/capital",
  path: "/capital",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedAnalyticsRoute = Route$6.update({
  id: "/analytics",
  path: "/analytics",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedLoansIndexRoute = Route$5.update({
  id: "/loans/",
  path: "/loans/",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedBorrowersIndexRoute = Route$4.update({
  id: "/borrowers/",
  path: "/borrowers/",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedLoansNewRoute = Route$3.update({
  id: "/loans/new",
  path: "/loans/new",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedLoansLoanIdRoute = Route$2.update({
  id: "/loans/$loanId",
  path: "/loans/$loanId",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedBorrowersNewRoute = Route$1.update({
  id: "/borrowers/new",
  path: "/borrowers/new",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedBorrowersBorrowerIdRoute = Route.update({
  id: "/borrowers/$borrowerId",
  path: "/borrowers/$borrowerId",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedRouteChildren = {
  AuthenticatedAnalyticsRoute,
  AuthenticatedCapitalRoute,
  AuthenticatedDashboardRoute,
  AuthenticatedPaymentsRoute,
  AuthenticatedSettingsRoute,
  AuthenticatedBorrowersBorrowerIdRoute,
  AuthenticatedBorrowersNewRoute,
  AuthenticatedLoansLoanIdRoute,
  AuthenticatedLoansNewRoute,
  AuthenticatedBorrowersIndexRoute,
  AuthenticatedLoansIndexRoute
};
const AuthenticatedRouteWithChildren = AuthenticatedRoute._addFileChildren(
  AuthenticatedRouteChildren
);
const rootRouteChildren = {
  IndexRoute,
  AuthenticatedRoute: AuthenticatedRouteWithChildren,
  LoginRoute,
  PortalTokenRoute
};
const routeTree = Route$f._addFileChildren(rootRouteChildren)._addFileTypes();
function getRouter() {
  const router2 = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0
  });
  return router2;
}
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  Button as B,
  Route$d as R,
  authStore as a,
  logout as b,
  Route$b as c,
  setLanguage as d,
  createSsrRpc as e,
  getDashboardSummary as f,
  getPortalData as g,
  getCashflowTimeline as h,
  getRecentActivity as i,
  getAreaBreakdown as j,
  getBorrowerRanking as k,
  login as l,
  getStatusDistribution as m,
  getMonthlySnapshot as n,
  Route$2 as o,
  Route as p,
  router as r,
  setAuthUser as s,
  toast as t,
  uiStore as u
};
