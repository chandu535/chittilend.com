const DEFAULTS = {
  PORTAL_TOKEN_LENGTH: 32,
  // 32 bytes = 64 hex chars
  ITEMS_PER_PAGE: 25,
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  // 10MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"]
};
const STATUS_COLORS = {
  active: "bg-violet-50 text-violet-700",
  completed: "bg-emerald-50 text-emerald-700",
  defaulted: "bg-red-50 text-red-600",
  extended: "bg-amber-50 text-amber-700",
  paid: "bg-emerald-50 text-emerald-700",
  pending: "bg-slate-100 text-slate-600",
  partial: "bg-amber-50 text-amber-700",
  overdue: "bg-red-50 text-red-600",
  waived: "bg-purple-50 text-purple-700"
};
export {
  DEFAULTS as D,
  STATUS_COLORS as S
};
