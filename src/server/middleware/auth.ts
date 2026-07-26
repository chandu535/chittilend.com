import { jwtVerify } from 'jose';
import { eq } from 'drizzle-orm';
import { getCookie } from '@tanstack/react-start/server';
import { db } from '../db';
import { users } from '../db/schema';
import { CONNECTION_ERROR, isDatabaseUnreachable } from '@/lib/connection';

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

/**
 * The caller is genuinely not signed in — no cookie, bad token, or a disabled account.
 * Anything else (database unreachable, missing JWT_SECRET) is an infrastructure fault
 * and must NOT be reported as a logged-out user, or a transient blip signs people out.
 */
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export async function getAuthenticatedUser(): Promise<AuthUser> {
  const token = getCookie(COOKIE_NAME);
  if (!token) {
    throw new AuthError('Not authenticated');
  }

  let payload: { userId: string; role: string };
  try {
    const { payload: decoded } = await jwtVerify(token, getJwtSecret());
    payload = decoded as unknown as { userId: string; role: string };
  } catch (error) {
    // A missing secret is a server misconfiguration, not a bad token.
    if (error instanceof Error && error.message.includes('JWT_SECRET')) throw error;
    throw new AuthError('Invalid or expired token');
  }

  if (!payload.userId) {
    throw new AuthError('Invalid token payload');
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
    throw new AuthError('User not found');
  }

  if (!user.isActive) {
    throw new AuthError('Account is deactivated');
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
  } catch (error) {
    if (error instanceof AuthError) return null;

    // Surfacing this is deliberate: a database or config failure here previously looked
    // identical to "signed out", so a blip during a save silently bounced the user to
    // the login screen and lost their work.
    if (isDatabaseUnreachable(error)) {
      // Re-thrown with a marker the client can recognise, because Error subclasses do
      // not survive the server-function boundary.
      console.warn('[auth] database unreachable during session check');
      throw new Error(CONNECTION_ERROR);
    }

    console.error('[auth] session check failed for a non-auth reason:', error);
    throw error;
  }
}
