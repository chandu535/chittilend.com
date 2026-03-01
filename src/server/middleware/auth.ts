import { jwtVerify } from 'jose';
import { eq } from 'drizzle-orm';
import { getCookie } from '@tanstack/react-start/server';
import { db } from '../db';
import { users } from '../db/schema';

const COOKIE_NAME = 'session';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');
  return new TextEncoder().encode(secret);
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager';
}

export async function getAuthenticatedUser(): Promise<AuthUser> {
  const token = getCookie(COOKIE_NAME);
  if (!token) {
    throw new Error('Not authenticated');
  }

  let payload: { userId: string; role: string };
  try {
    const { payload: decoded } = await jwtVerify(token, getJwtSecret());
    payload = decoded as unknown as { userId: string; role: string };
  } catch {
    throw new Error('Invalid or expired token');
  }

  if (!payload.userId) {
    throw new Error('Invalid token payload');
  }

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.id, payload.userId))
    .limit(1);

  if (!user) {
    throw new Error('User not found');
  }

  if (!user.isActive) {
    throw new Error('Account is deactivated');
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export async function getOptionalUser(): Promise<AuthUser | null> {
  try {
    return await getAuthenticatedUser();
  } catch {
    return null;
  }
}
