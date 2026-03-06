const DEFAULTS = {
  PORTAL_TOKEN_LENGTH: 32,
  // 32 bytes = 64 hex chars
  ITEMS_PER_PAGE: 25,
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  // 10MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"]
};
const STATUS_COLORS = {
  active: "bg-blue-100 text-blue-800",
  completed: "bg-emerald-100 text-emerald-800",
  defaulted: "bg-red-100 text-red-800",
  extended: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  pending: "bg-slate-100 text-slate-800",
  partial: "bg-amber-100 text-amber-800",
  overdue: "bg-red-100 text-red-800",
  waived: "bg-purple-100 text-purple-800"
};
export {
  DEFAULTS as D,
  STATUS_COLORS as S
};
