import { createServerFn } from '@tanstack/react-start';
import { eq } from 'drizzle-orm';
import { hash } from 'bcryptjs';
import { db } from '../db';
import { users } from '../db/schema';
import { getAuthenticatedUser } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';

export const listManagers = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await getAuthenticatedUser();
  requireRole(user, ['admin']);

  const result = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.role, 'manager'))
    .orderBy(users.name);

  return result;
});

export const createManager = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const input = data as { name: string; email: string; password: string };
    if (!input.name || input.name.length < 2) {
      throw new Error('Name must be at least 2 characters');
    }
    if (!input.email || !input.email.includes('@')) {
      throw new Error('Valid email is required');
    }
    if (!input.password || input.password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
    return input;
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requireRole(user, ['admin']);

    // Check if email already exists
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (existing) {
      throw new Error('Email already registered');
    }

    const passwordHash = await hash(data.password, 10);

    const [manager] = await db
      .insert(users)
      .values({
        name: data.name,
        email: data.email,
        passwordHash,
        role: 'manager',
        isActive: true,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
      });

    return manager;
  });

export const toggleManagerActive = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const input = data as { managerId: string };
    if (!input.managerId) throw new Error('Manager ID is required');
    return input;
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requireRole(user, ['admin']);

    // Get current state
    const [manager] = await db
      .select({ id: users.id, isActive: users.isActive, role: users.role })
      .from(users)
      .where(eq(users.id, data.managerId))
      .limit(1);

    if (!manager) throw new Error('Manager not found');
    if (manager.role !== 'manager') throw new Error('Cannot modify admin accounts');

    const [updated] = await db
      .update(users)
      .set({
        isActive: !manager.isActive,
        updatedAt: new Date(),
      })
      .where(eq(users.id, data.managerId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        isActive: users.isActive,
      });

    return updated;
  });
