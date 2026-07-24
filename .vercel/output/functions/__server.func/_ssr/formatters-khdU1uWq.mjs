function formatNumber(amount, { lang }) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "—";
  const locale = lang === "te" ? "te-IN" : "en-IN";
  return new Intl.NumberFormat(locale, { numberingSystem: "latn" }).format(num);
}
function formatINR(amount, { lang }) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "₹—";
  const locale = lang === "te" ? "te-IN" : "en-IN";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "INR",
    numberingSystem: "latn",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
}
function formatINRCompact(amount, { lang }) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "₹—";
  const denominations = {
    en: {
      crore: { threshold: 1e7, singular: "Crore", plural: "Crores" },
      lakh: { threshold: 1e5, singular: "Lakh", plural: "Lakhs" },
      thousand: { threshold: 1e3, singular: "K", plural: "K" }
    },
    te: {
      crore: { threshold: 1e7, singular: "కోటి", plural: "కోట్లు" },
      lakh: { threshold: 1e5, singular: "లక్ష", plural: "లక్షలు" },
      thousand: { threshold: 1e3, singular: "వేలు", plural: "వేలు" }
    }
  };
  const d = denominations[lang];
  let value;
  let label;
  if (num >= d.crore.threshold) {
    value = num / d.crore.threshold;
    label = value === 1 ? d.crore.singular : d.crore.plural;
  } else if (num >= d.lakh.threshold) {
    value = num / d.lakh.threshold;
    label = value === 1 ? d.lakh.singular : d.lakh.plural;
  } else if (num >= d.thousand.threshold) {
    value = num / d.thousand.threshold;
    label = value === 1 ? d.thousand.singular : d.thousand.plural;
  } else {
    return formatINR(num, { lang });
  }
  const formattedValue = formatNumber(
    Math.round(value * 10) / 10,
    { lang }
  );
  return `₹${formattedValue} ${label}`;
}
function formatDate(date, { lang }) {
  const d = typeof date === "string" ? new Date(date) : date;
  const locale = lang === "te" ? "te-IN" : "en-IN";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
    numberingSystem: "latn"
  }).format(d);
}
function formatMonthYear(date, { lang }) {
  const d = typeof date === "string" ? new Date(date) : date;
  const locale = lang === "te" ? "te-IN" : "en-IN";
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
    numberingSystem: "latn"
  }).format(d);
}
function formatPhone(mobile) {
  return mobile.replace(/(\d{5})(\d{5})/, "$1 $2");
}
function formatPercent(value, { lang }) {
  const locale = lang === "te" ? "te-IN" : "en-IN";
  return new Intl.NumberFormat(locale, {
    style: "percent",
    numberingSystem: "latn",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  }).format(value / 100);
}
export {
  formatMonthYear as a,
  formatPercent as b,
  formatINRCompact as c,
  formatINR as d,
  formatDate as e,
  formatNumber as f,
  formatPhone as g
};
