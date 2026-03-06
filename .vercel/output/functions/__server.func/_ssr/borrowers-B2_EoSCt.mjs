import { c as createServerRpc, b as borrowers, d as db, l as loans } from "./index-BN40sTes.mjs";
import { randomBytes } from "crypto";
import { c as createBorrowerSchema, u as updateBorrowerSchema } from "./borrower-ffkpRuRL.mjs";
import { a as getAuthenticatedUser } from "./auth-BKEQ4cPm.mjs";
import { r as requireRole } from "./roleGuard-MoSFikSq.mjs";
import { D as DEFAULTS } from "./constants-DFV23y0t.mjs";
import { c as createServerFn } from "./index.mjs";
import { o as or, i as ilike, e as eq, a as sql, d as desc, c as count, b as and } from "../_libs/drizzle-orm.mjs";
import "../_chunks/_libs/@neondatabase/serverless.mjs";
import "../_libs/joi.mjs";
import "../_chunks/_libs/react.mjs";
import "../_chunks/_libs/@hapi/hoek.mjs";
import "../_chunks/_libs/@hapi/formula.mjs";
import "../_chunks/_libs/@hapi/pinpoint.mjs";
import "../_chunks/_libs/@hapi/topo.mjs";
import "../_chunks/_libs/@hapi/address.mjs";
import "url";
import "util";
import "../_chunks/_libs/@hapi/tlds.mjs";
import "../_libs/jose.mjs";
import "../_chunks/_libs/@tanstack/history.mjs";
import "../_chunks/_libs/@tanstack/router-core.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/tiny-invariant.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "../_chunks/_libs/@tanstack/react-router.mjs";
import "../_chunks/_libs/react-dom.mjs";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/tiny-warning.mjs";
const listBorrowers_createServerFn_handler = createServerRpc({
  id: "2b1febee5c8352ad582297cea76d90d23bf6ab8bb6f7abdcc2d6b34723e07067",
  name: "listBorrowers",
  filename: "src/server/functions/borrowers.ts"
}, (opts) => listBorrowers.__executeServer(opts));
const listBorrowers = createServerFn({
  method: "GET"
}).inputValidator((data) => {
  const d = data;
  return {
    page: d.page || 1,
    limit: d.limit || DEFAULTS.ITEMS_PER_PAGE,
    area: d.area || "",
    search: d.search || ""
  };
}).handler(listBorrowers_createServerFn_handler, async ({
  data
}) => {
  const user = await getAuthenticatedUser();
  requireRole(user, ["admin", "manager"]);
  const offset = (data.page - 1) * data.limit;
  const conditions = [];
  if (data.search) {
    const pattern = `%${data.search}%`;
    conditions.push(or(ilike(borrowers.name, pattern), ilike(borrowers.mobile, pattern)));
  }
  if (data.area && data.area !== "all") {
    conditions.push(eq(borrowers.area, data.area));
  }
  const where = conditions.length > 0 ? sql`${sql.join(conditions.map((c) => c), sql` AND `)}` : void 0;
  const [items, totalResult] = await Promise.all([db.select().from(borrowers).where(where).orderBy(desc(borrowers.createdAt)).limit(data.limit).offset(offset), db.select({
    count: count()
  }).from(borrowers).where(where)]);
  return {
    items,
    total: totalResult[0].count,
    page: data.page,
    limit: data.limit,
    totalPages: Math.ceil(totalResult[0].count / data.limit)
  };
});
const getBorrowerById_createServerFn_handler = createServerRpc({
  id: "f8fa8e37fb95dcb732a5664237572af025802fa7026aa5bb268ecb5b3db6efa8",
  name: "getBorrowerById",
  filename: "src/server/functions/borrowers.ts"
}, (opts) => getBorrowerById.__executeServer(opts));
const getBorrowerById = createServerFn({
  method: "GET"
}).inputValidator((data) => {
  const id = data.id;
  if (!id) throw new Error("Borrower ID is required");
  return {
    id
  };
}).handler(getBorrowerById_createServerFn_handler, async ({
  data
}) => {
  const user = await getAuthenticatedUser();
  requireRole(user, ["admin", "manager"]);
  const borrower = await db.query.borrowers.findFirst({
    where: eq(borrowers.id, data.id),
    with: {
      loans: {
        columns: {
          id: true,
          primaryAmount: true,
          totalRepayment: true,
          status: true,
          dateGiven: true
        }
      }
    }
  });
  if (!borrower) throw new Error("Borrower not found");
  return borrower;
});
const createBorrower_createServerFn_handler = createServerRpc({
  id: "9224c6c400432973e2a31c14018e45cd63e0a8de4b5ec9883bb6ff7b28501648",
  name: "createBorrower",
  filename: "src/server/functions/borrowers.ts"
}, (opts) => createBorrower.__executeServer(opts));
const createBorrower = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const {
    error,
    value
  } = createBorrowerSchema.validate(data, {
    abortEarly: false
  });
  if (error) {
    const messages = error.details.map((d) => d.message).join(", ");
    throw new Error(messages);
  }
  return value;
}).handler(createBorrower_createServerFn_handler, async ({
  data
}) => {
  const user = await getAuthenticatedUser();
  requireRole(user, ["admin", "manager"]);
  const existing = await db.select({
    id: borrowers.id
  }).from(borrowers).where(eq(borrowers.mobile, data.mobile)).limit(1);
  if (existing.length > 0) {
    throw new Error("This mobile number is already registered");
  }
  const portalToken = randomBytes(DEFAULTS.PORTAL_TOKEN_LENGTH).toString("hex");
  const [borrower] = await db.insert(borrowers).values({
    name: data.name,
    mobile: data.mobile,
    area: data.area || null,
    address: data.address || null,
    locationLat: data.locationLat?.toString() || null,
    locationLng: data.locationLng?.toString() || null,
    suretyType: data.suretyType || "owner",
    suretyReferenceId: data.suretyReferenceId || null,
    aadhaarPhotoUrl: data.aadhaarPhotoUrl || null,
    profilePhotoUrl: data.profilePhotoUrl || null,
    portalToken,
    createdBy: user.id
  }).returning();
  return borrower;
});
const updateBorrower_createServerFn_handler = createServerRpc({
  id: "b7a4cf04ffd8a5b15f834ee95339c99b18115fde677512f72a588f58ff6d4387",
  name: "updateBorrower",
  filename: "src/server/functions/borrowers.ts"
}, (opts) => updateBorrower.__executeServer(opts));
const updateBorrower = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const d = data;
  const {
    id,
    ...rest
  } = d;
  if (!id) throw new Error("Borrower ID is required");
  const {
    error,
    value
  } = updateBorrowerSchema.validate(rest, {
    abortEarly: false
  });
  if (error) {
    const messages = error.details.map((d2) => d2.message).join(", ");
    throw new Error(messages);
  }
  return {
    id,
    ...value
  };
}).handler(updateBorrower_createServerFn_handler, async ({
  data
}) => {
  const user = await getAuthenticatedUser();
  requireRole(user, ["admin", "manager"]);
  const {
    id,
    ...updateData
  } = data;
  if (updateData.mobile) {
    const existing = await db.select({
      id: borrowers.id
    }).from(borrowers).where(eq(borrowers.mobile, updateData.mobile)).limit(1);
    if (existing.length > 0 && existing[0].id !== id) {
      throw new Error("This mobile number is already registered");
    }
  }
  const [updated] = await db.update(borrowers).set({
    ...updateData,
    locationLat: updateData.locationLat?.toString() || void 0,
    locationLng: updateData.locationLng?.toString() || void 0,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(borrowers.id, id)).returning();
  if (!updated) throw new Error("Borrower not found");
  return updated;
});
const generateNewMagicLink_createServerFn_handler = createServerRpc({
  id: "17d267557b2ea379c4700e1419c007e8de89febce492c7fade7b8b457a61f2f7",
  name: "generateNewMagicLink",
  filename: "src/server/functions/borrowers.ts"
}, (opts) => generateNewMagicLink.__executeServer(opts));
const generateNewMagicLink = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const id = data.id;
  if (!id) throw new Error("Borrower ID is required");
  return {
    id
  };
}).handler(generateNewMagicLink_createServerFn_handler, async ({
  data
}) => {
  const user = await getAuthenticatedUser();
  requireRole(user, ["admin", "manager"]);
  const portalToken = randomBytes(DEFAULTS.PORTAL_TOKEN_LENGTH).toString("hex");
  const [updated] = await db.update(borrowers).set({
    portalToken,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(borrowers.id, data.id)).returning();
  if (!updated) throw new Error("Borrower not found");
  return {
    portalToken: updated.portalToken
  };
});
const searchBorrowers_createServerFn_handler = createServerRpc({
  id: "89ade9f6e5ddc3ac6b5567266dc044c9dcdeb1bae24e7d378d558882950d24b1",
  name: "searchBorrowers",
  filename: "src/server/functions/borrowers.ts"
}, (opts) => searchBorrowers.__executeServer(opts));
const searchBorrowers = createServerFn({
  method: "GET"
}).inputValidator((data) => {
  const query = data.query;
  if (!query || query.length < 1) throw new Error("Search query required");
  return {
    query
  };
}).handler(searchBorrowers_createServerFn_handler, async ({
  data
}) => {
  const user = await getAuthenticatedUser();
  requireRole(user, ["admin", "manager"]);
  const pattern = `%${data.query}%`;
  const results = await db.select({
    id: borrowers.id,
    name: borrowers.name,
    mobile: borrowers.mobile,
    area: borrowers.area
  }).from(borrowers).where(or(ilike(borrowers.name, pattern), ilike(borrowers.mobile, pattern))).limit(10);
  return results;
});
const deleteBorrower_createServerFn_handler = createServerRpc({
  id: "8e6468c5eff369b3b413d794897027be351edd040f192ff3545adfccc32ca6e4",
  name: "deleteBorrower",
  filename: "src/server/functions/borrowers.ts"
}, (opts) => deleteBorrower.__executeServer(opts));
const deleteBorrower = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const id = data.id;
  if (!id) throw new Error("Borrower ID is required");
  return {
    id
  };
}).handler(deleteBorrower_createServerFn_handler, async ({
  data
}) => {
  const user = await getAuthenticatedUser();
  requireRole(user, ["admin", "manager"]);
  const activeLoans = await db.select({
    id: loans.id
  }).from(loans).where(and(eq(loans.borrowerId, data.id), or(eq(loans.status, "active"), eq(loans.status, "extended")))).limit(1);
  if (activeLoans.length > 0) {
    throw new Error("BORROWER_HAS_ACTIVE_LOANS");
  }
  const [deleted] = await db.delete(borrowers).where(eq(borrowers.id, data.id)).returning({
    id: borrowers.id
  });
  if (!deleted) throw new Error("Borrower not found");
  return {
    success: true
  };
});
const listAreas_createServerFn_handler = createServerRpc({
  id: "faf23032f626d47cf6b4fdfa73ba96d0e74bb314fefc6c764d95b0f7bacf768d",
  name: "listAreas",
  filename: "src/server/functions/borrowers.ts"
}, (opts) => listAreas.__executeServer(opts));
const listAreas = createServerFn({
  method: "GET"
}).handler(listAreas_createServerFn_handler, async () => {
  const user = await getAuthenticatedUser();
  requireRole(user, ["admin", "manager"]);
  const areas = await db.selectDistinct({
    area: borrowers.area
  }).from(borrowers).where(sql`${borrowers.area} IS NOT NULL AND ${borrowers.area} != ''`).orderBy(borrowers.area);
  return areas.map((a) => a.area);
});
export {
  createBorrower_createServerFn_handler,
  deleteBorrower_createServerFn_handler,
  generateNewMagicLink_createServerFn_handler,
  getBorrowerById_createServerFn_handler,
  listAreas_createServerFn_handler,
  listBorrowers_createServerFn_handler,
  searchBorrowers_createServerFn_handler,
  updateBorrower_createServerFn_handler
};
