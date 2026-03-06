import { T as TSS_SERVER_FUNCTION } from "./index.mjs";
import { c as cs } from "../_chunks/_libs/@neondatabase/serverless.mjs";
import { p as pgEnum, f as pgTable, t as timestamp, h as boolean, v as varchar, u as uuid, j as text, k as decimal, m as integer, n as date, q as drizzle, r as uniqueIndex, w as index, x as relations } from "../_libs/drizzle-orm.mjs";
const createServerRpc = (serverFnMeta, splitImportFn) => {
  const url = "/_serverFn/" + serverFnMeta.id;
  return Object.assign(splitImportFn, {
    url,
    serverFnMeta,
    [TSS_SERVER_FUNCTION]: true
  });
};
const userRoleEnum = pgEnum("user_role", ["admin", "manager"]);
const loanStatusEnum = pgEnum("loan_status", [
  "active",
  "completed",
  "defaulted",
  "extended"
]);
const paymentFrequencyEnum = pgEnum("payment_frequency", [
  "monthly",
  "weekly"
]);
const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "partial",
  "overdue",
  "waived"
]);
const suretyTypeEnum = pgEnum("surety_type", [
  "existing_borrower",
  "owner"
]);
const capitalEventTypeEnum = pgEnum("capital_event_type", [
  "investment",
  "collection",
  "disbursement"
]);
const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull().default("manager"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("users_email_idx").on(table.email)
]);
const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  index("sessions_user_id_idx").on(table.userId),
  index("sessions_token_idx").on(table.token)
]);
const borrowers = pgTable("borrowers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  mobile: varchar("mobile", { length: 10 }).notNull(),
  area: varchar("area", { length: 255 }),
  address: text("address"),
  locationLat: decimal("location_lat", { precision: 10, scale: 7 }),
  locationLng: decimal("location_lng", { precision: 10, scale: 7 }),
  aadhaarPhotoUrl: text("aadhaar_photo_url"),
  profilePhotoUrl: text("profile_photo_url"),
  suretyType: suretyTypeEnum("surety_type").default("owner"),
  suretyReferenceId: uuid("surety_reference_id"),
  portalToken: varchar("portal_token", { length: 64 }).notNull(),
  portalTokenExpiry: timestamp("portal_token_expiry", { withTimezone: true }),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex("borrowers_mobile_idx").on(table.mobile),
  uniqueIndex("borrowers_portal_token_idx").on(table.portalToken),
  index("borrowers_area_idx").on(table.area),
  index("borrowers_name_idx").on(table.name)
]);
const loans = pgTable("loans", {
  id: uuid("id").primaryKey().defaultRandom(),
  borrowerId: uuid("borrower_id").notNull().references(() => borrowers.id, { onDelete: "restrict" }),
  dateGiven: date("date_given").notNull(),
  startMonth: date("start_month").notNull(),
  primaryAmount: decimal("primary_amount", { precision: 12, scale: 2 }).notNull(),
  serviceChargePercent: decimal("service_charge_percent", { precision: 5, scale: 2 }).notNull().default("1.00"),
  serviceChargeAmount: decimal("service_charge_amount", { precision: 12, scale: 2 }).notNull(),
  amountUserReceived: decimal("amount_user_received", { precision: 12, scale: 2 }).notNull(),
  markupPercent: decimal("markup_percent", { precision: 5, scale: 2 }).notNull().default("25.00"),
  totalRepayment: decimal("total_repayment", { precision: 12, scale: 2 }).notNull(),
  tenureMonths: integer("tenure_months").notNull().default(5),
  paymentFrequency: paymentFrequencyEnum("payment_frequency").notNull().default("monthly"),
  installmentAmount: decimal("installment_amount", { precision: 12, scale: 2 }).notNull(),
  totalInstallments: integer("total_installments").notNull(),
  profitAmount: decimal("profit_amount", { precision: 12, scale: 2 }).notNull(),
  status: loanStatusEnum("status").notNull().default("active"),
  notes: text("notes"),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  index("loans_borrower_id_idx").on(table.borrowerId),
  index("loans_status_idx").on(table.status),
  index("loans_date_given_idx").on(table.dateGiven),
  index("loans_created_by_idx").on(table.createdBy)
]);
const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  loanId: uuid("loan_id").notNull().references(() => loans.id, { onDelete: "cascade" }),
  installmentNumber: integer("installment_number").notNull(),
  dueDate: date("due_date").notNull(),
  amountDue: decimal("amount_due", { precision: 12, scale: 2 }).notNull(),
  amountPaid: decimal("amount_paid", { precision: 12, scale: 2 }).notNull().default("0.00"),
  paidDate: date("paid_date"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  notes: text("notes"),
  recordedBy: uuid("recorded_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  index("payments_loan_id_idx").on(table.loanId),
  index("payments_status_idx").on(table.status),
  index("payments_due_date_idx").on(table.dueDate)
]);
const capitalPoolLog = pgTable("capital_pool_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventDate: timestamp("event_date", { withTimezone: true }).notNull().defaultNow(),
  eventType: capitalEventTypeEnum("event_type").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  runningBalance: decimal("running_balance", { precision: 12, scale: 2 }).notNull(),
  referenceLoanId: uuid("reference_loan_id").references(() => loans.id),
  referencePaymentId: uuid("reference_payment_id").references(() => payments.id),
  notes: text("notes"),
  recordedBy: uuid("recorded_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  index("capital_pool_event_date_idx").on(table.eventDate),
  index("capital_pool_event_type_idx").on(table.eventType)
]);
const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  createdBorrowers: many(borrowers),
  createdLoans: many(loans)
}));
const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id]
  })
}));
const borrowersRelations = relations(borrowers, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [borrowers.createdBy],
    references: [users.id]
  }),
  suretyReference: one(borrowers, {
    fields: [borrowers.suretyReferenceId],
    references: [borrowers.id]
  }),
  loans: many(loans)
}));
const loansRelations = relations(loans, ({ one, many }) => ({
  borrower: one(borrowers, {
    fields: [loans.borrowerId],
    references: [borrowers.id]
  }),
  createdByUser: one(users, {
    fields: [loans.createdBy],
    references: [users.id]
  }),
  payments: many(payments)
}));
const paymentsRelations = relations(payments, ({ one }) => ({
  loan: one(loans, {
    fields: [payments.loanId],
    references: [loans.id]
  }),
  recordedByUser: one(users, {
    fields: [payments.recordedBy],
    references: [users.id]
  })
}));
const capitalPoolLogRelations = relations(capitalPoolLog, ({ one }) => ({
  referenceLoan: one(loans, {
    fields: [capitalPoolLog.referenceLoanId],
    references: [loans.id]
  }),
  referencePayment: one(payments, {
    fields: [capitalPoolLog.referencePaymentId],
    references: [payments.id]
  }),
  recordedByUser: one(users, {
    fields: [capitalPoolLog.recordedBy],
    references: [users.id]
  })
}));
const schema = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  borrowers,
  borrowersRelations,
  capitalEventTypeEnum,
  capitalPoolLog,
  capitalPoolLogRelations,
  loanStatusEnum,
  loans,
  loansRelations,
  paymentFrequencyEnum,
  paymentStatusEnum,
  payments,
  paymentsRelations,
  sessions,
  sessionsRelations,
  suretyTypeEnum,
  userRoleEnum,
  users,
  usersRelations
}, Symbol.toStringTag, { value: "Module" }));
let _db = null;
function getDb() {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL not configured");
    const sql = cs(url);
    _db = drizzle(sql, { schema });
  }
  return _db;
}
const db = new Proxy({}, {
  get(_target, prop) {
    return getDb()[prop];
  }
});
export {
  capitalPoolLog as a,
  borrowers as b,
  createServerRpc as c,
  db as d,
  loans as l,
  payments as p,
  users as u
};
