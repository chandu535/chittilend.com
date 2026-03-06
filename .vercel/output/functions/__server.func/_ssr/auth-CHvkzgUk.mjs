import { c as createServerRpc, d as db, u as users, b as borrowers } from "./index-BN40sTes.mjs";
import { c as compare } from "../_libs/bcryptjs.mjs";
import { l as loginSchema } from "./auth-CwIywibs.mjs";
import { g as getOptionalUser } from "./auth-BKEQ4cPm.mjs";
import { c as createServerFn, s as setCookie, d as deleteCookie } from "./index.mjs";
import { S as SignJWT } from "../_libs/jose.mjs";
import { e as eq } from "../_libs/drizzle-orm.mjs";
import "../_chunks/_libs/@neondatabase/serverless.mjs";
import "crypto";
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
const COOKIE_NAME = "session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not configured");
  return new TextEncoder().encode(secret);
}
const login_createServerFn_handler = createServerRpc({
  id: "c66295356ee1bed9dcd6acc6996417714105d1c255d6dc117cb348c4624a9cfa",
  name: "login",
  filename: "src/server/functions/auth.ts"
}, (opts) => login.__executeServer(opts));
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
}).handler(login_createServerFn_handler, async ({
  data
}) => {
  const [user] = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
  if (!user) {
    throw new Error("Invalid email or password");
  }
  if (!user.isActive) {
    throw new Error("Account is deactivated");
  }
  const passwordValid = await compare(data.password, user.passwordHash);
  if (!passwordValid) {
    throw new Error("Invalid email or password");
  }
  const token = await new SignJWT({
    userId: user.id,
    role: user.role
  }).setProtectedHeader({
    alg: "HS256"
  }).setIssuedAt().setExpirationTime("7d").sign(getJwtSecret());
  setCookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/"
  });
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
});
const logout_createServerFn_handler = createServerRpc({
  id: "29fdd7534a8fc4cc73a2fc0e6a37abee71570be1256a0cd8b872f6c5140c326e",
  name: "logout",
  filename: "src/server/functions/auth.ts"
}, (opts) => logout.__executeServer(opts));
const logout = createServerFn({
  method: "POST"
}).handler(logout_createServerFn_handler, async () => {
  deleteCookie(COOKIE_NAME, {
    path: "/"
  });
  return {
    success: true
  };
});
const getSession_createServerFn_handler = createServerRpc({
  id: "bf7d44565f0a75f8775052ea39a4b3599b3e66c0d477bc07f07917b7fb9585ca",
  name: "getSession",
  filename: "src/server/functions/auth.ts"
}, (opts) => getSession.__executeServer(opts));
const getSession = createServerFn({
  method: "GET"
}).handler(getSession_createServerFn_handler, async () => {
  const user = await getOptionalUser();
  return {
    user
  };
});
const verifyPortalToken_createServerFn_handler = createServerRpc({
  id: "8829a2c83808fdbc570343dfba48bb912c280a25f1e33ff0d12598054a2751a2",
  name: "verifyPortalToken",
  filename: "src/server/functions/auth.ts"
}, (opts) => verifyPortalToken.__executeServer(opts));
const verifyPortalToken = createServerFn({
  method: "GET"
}).inputValidator((data) => {
  const token = data.token;
  if (!token || typeof token !== "string" || token.length !== 64) {
    throw new Error("Invalid portal token");
  }
  return {
    token
  };
}).handler(verifyPortalToken_createServerFn_handler, async ({
  data
}) => {
  const [borrower] = await db.select().from(borrowers).where(eq(borrowers.portalToken, data.token)).limit(1);
  if (!borrower) {
    throw new Error("Invalid portal link");
  }
  if (borrower.portalTokenExpiry && new Date(borrower.portalTokenExpiry) < /* @__PURE__ */ new Date()) {
    throw new Error("Portal link has expired");
  }
  return {
    id: borrower.id,
    name: borrower.name,
    mobile: borrower.mobile,
    area: borrower.area
  };
});
export {
  getSession_createServerFn_handler,
  login_createServerFn_handler,
  logout_createServerFn_handler,
  verifyPortalToken_createServerFn_handler
};
