import { createServerFn } from '@tanstack/react-start';
import { setCookie, deleteCookie } from '@tanstack/react-start/server';
import { SignJWT } from 'jose';
import { compare } from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users, borrowers } from '../db/schema';
import { loginSchema } from '../validators/auth';
import { getOptionalUser, type AuthUser } from '../middleware/auth';
import { CONNECTION_ERROR, isDatabaseUnreachable } from '@/lib/connection';

const COOKIE_NAME = 'session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');
  return new TextEncoder().encode(secret);
}

export const login = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const { error, value } = loginSchema.validate(data, { abortEarly: false });
    if (error) {
      const messages = error.details.map((d) => d.message).join(', ');
      throw new Error(messages);
    }
    return value as { email: string; password: string };
  })
  .handler(async ({ data }) => {
    // A database that cannot be reached is not a rejected login. Without this the driver
    // error travelled to the browser verbatim — raw SQL, and the email address in the
    // query parameters — where it read as though the credentials were at fault.
    let user;
    try {
      [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, data.email))
        .limit(1);
    } catch (err) {
      if (isDatabaseUnreachable(err)) throw new Error(CONNECTION_ERROR);
      throw new Error('Could not sign in. Please try again.');
    }

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    const passwordValid = await compare(data.password, user.passwordHash);
    if (!passwordValid) {
      throw new Error('Invalid email or password');
    }

    // Create JWT
    const token = await new SignJWT({ userId: user.id, role: user.role })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(getJwtSecret());

    // Set httpOnly cookie
    setCookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  });

export const logout = createServerFn({ method: 'POST' }).handler(async () => {
  deleteCookie(COOKIE_NAME, {
    path: '/',
  });
  return { success: true };
});

export const getSession = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{ user: AuthUser | null }> => {
    const user = await getOptionalUser();
    return { user };
  },
);

export const verifyPortalToken = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => {
    const token = (data as { token: string }).token;
    if (!token || typeof token !== 'string' || token.length !== 64) {
      throw new Error('Invalid portal token');
    }
    return { token };
  })
  .handler(async ({ data }) => {
    const [borrower] = await db
      .select()
      .from(borrowers)
      .where(eq(borrowers.portalToken, data.token))
      .limit(1);

    if (!borrower) {
      throw new Error('Invalid portal link');
    }

    // Check expiry if set
    if (borrower.portalTokenExpiry && new Date(borrower.portalTokenExpiry) < new Date()) {
      throw new Error('Portal link has expired');
    }

    return {
      id: borrower.id,
      name: borrower.name,
      mobile: borrower.mobile,
      area: borrower.area,
    };
  });
