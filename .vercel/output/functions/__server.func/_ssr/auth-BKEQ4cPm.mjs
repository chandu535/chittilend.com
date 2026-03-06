import { d as db, u as users } from "./index-BN40sTes.mjs";
import { a as getCookie } from "./index.mjs";
import { j as jwtVerify } from "../_libs/jose.mjs";
import { e as eq } from "../_libs/drizzle-orm.mjs";
const COOKIE_NAME = "session";
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not configured");
  return new TextEncoder().encode(secret);
}
async function getAuthenticatedUser() {
  const token = getCookie(COOKIE_NAME);
  if (!token) {
    throw new Error("Not authenticated");
  }
  let payload;
  try {
    const { payload: decoded } = await jwtVerify(token, getJwtSecret());
    payload = decoded;
  } catch {
    throw new Error("Invalid or expired token");
  }
  if (!payload.userId) {
    throw new Error("Invalid token payload");
  }
  const [user] = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    isActive: users.isActive
  }).from(users).where(eq(users.id, payload.userId)).limit(1);
  if (!user) {
    throw new Error("User not found");
  }
  if (!user.isActive) {
    throw new Error("Account is deactivated");
  }
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}
async function getOptionalUser() {
  try {
    return await getAuthenticatedUser();
  } catch {
    return null;
  }
}
export {
  getAuthenticatedUser as a,
  getOptionalUser as g
};
