import { c as createServerRpc, d as db, u as users } from "./index-BN40sTes.mjs";
import { h as hash } from "../_libs/bcryptjs.mjs";
import { a as getAuthenticatedUser } from "./auth-BKEQ4cPm.mjs";
import { r as requireRole } from "./roleGuard-MoSFikSq.mjs";
import { c as createServerFn } from "./index.mjs";
import { e as eq } from "../_libs/drizzle-orm.mjs";
import "../_chunks/_libs/@neondatabase/serverless.mjs";
import "crypto";
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
import "../_chunks/_libs/react.mjs";
import "../_chunks/_libs/@tanstack/react-router.mjs";
import "../_chunks/_libs/react-dom.mjs";
import "util";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/tiny-warning.mjs";
const listManagers_createServerFn_handler = createServerRpc({
  id: "4ac19b88fda24680112998290cab23be6b3ca6dbd7a210ce4a0ded515ed2c8ba",
  name: "listManagers",
  filename: "src/server/functions/users.ts"
}, (opts) => listManagers.__executeServer(opts));
const listManagers = createServerFn({
  method: "GET"
}).handler(listManagers_createServerFn_handler, async () => {
  const user = await getAuthenticatedUser();
  requireRole(user, ["admin"]);
  const result = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    isActive: users.isActive,
    createdAt: users.createdAt
  }).from(users).where(eq(users.role, "manager")).orderBy(users.name);
  return result;
});
const createManager_createServerFn_handler = createServerRpc({
  id: "3522d6afa08eb1863225729ae565bc746cf03f7dff76d212cb10a9b18ba28bbd",
  name: "createManager",
  filename: "src/server/functions/users.ts"
}, (opts) => createManager.__executeServer(opts));
const createManager = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const input = data;
  if (!input.name || input.name.length < 2) {
    throw new Error("Name must be at least 2 characters");
  }
  if (!input.email || !input.email.includes("@")) {
    throw new Error("Valid email is required");
  }
  if (!input.password || input.password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }
  return input;
}).handler(createManager_createServerFn_handler, async ({
  data
}) => {
  const user = await getAuthenticatedUser();
  requireRole(user, ["admin"]);
  const [existing] = await db.select({
    id: users.id
  }).from(users).where(eq(users.email, data.email)).limit(1);
  if (existing) {
    throw new Error("Email already registered");
  }
  const passwordHash = await hash(data.password, 10);
  const [manager] = await db.insert(users).values({
    name: data.name,
    email: data.email,
    passwordHash,
    role: "manager",
    isActive: true
  }).returning({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    isActive: users.isActive
  });
  return manager;
});
const toggleManagerActive_createServerFn_handler = createServerRpc({
  id: "0de027824cdfd2a4d95cdce2b5fe1a4d14143af767c24d1ce2d191f08b910dc0",
  name: "toggleManagerActive",
  filename: "src/server/functions/users.ts"
}, (opts) => toggleManagerActive.__executeServer(opts));
const toggleManagerActive = createServerFn({
  method: "POST"
}).inputValidator((data) => {
  const input = data;
  if (!input.managerId) throw new Error("Manager ID is required");
  return input;
}).handler(toggleManagerActive_createServerFn_handler, async ({
  data
}) => {
  const user = await getAuthenticatedUser();
  requireRole(user, ["admin"]);
  const [manager] = await db.select({
    id: users.id,
    isActive: users.isActive,
    role: users.role
  }).from(users).where(eq(users.id, data.managerId)).limit(1);
  if (!manager) throw new Error("Manager not found");
  if (manager.role !== "manager") throw new Error("Cannot modify admin accounts");
  const [updated] = await db.update(users).set({
    isActive: !manager.isActive,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(users.id, data.managerId)).returning({
    id: users.id,
    name: users.name,
    email: users.email,
    isActive: users.isActive
  });
  return updated;
});
export {
  createManager_createServerFn_handler,
  listManagers_createServerFn_handler,
  toggleManagerActive_createServerFn_handler
};
