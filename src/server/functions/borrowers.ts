import { createServerFn } from '@tanstack/react-start';
import { eq, ilike, or, sql, desc, count } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { db } from '../db';
import { borrowers } from '../db/schema';
import { createBorrowerSchema, updateBorrowerSchema } from '../validators/borrower';
import { getAuthenticatedUser } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';
import { DEFAULTS } from '@/lib/constants';

export const listBorrowers = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => {
    const d = data as {
      page?: number;
      limit?: number;
      area?: string;
      search?: string;
    };
    return {
      page: d.page || 1,
      limit: d.limit || DEFAULTS.ITEMS_PER_PAGE,
      area: d.area || '',
      search: d.search || '',
    };
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requireRole(user, ['admin', 'manager']);

    const offset = (data.page - 1) * data.limit;
    const conditions = [];

    if (data.search) {
      const pattern = `%${data.search}%`;
      conditions.push(
        or(
          ilike(borrowers.name, pattern),
          ilike(borrowers.mobile, pattern),
        ),
      );
    }

    if (data.area && data.area !== 'all') {
      conditions.push(eq(borrowers.area, data.area));
    }

    const where = conditions.length > 0
      ? sql`${sql.join(conditions.map(c => c!), sql` AND `)}`
      : undefined;

    const [items, totalResult] = await Promise.all([
      db
        .select()
        .from(borrowers)
        .where(where)
        .orderBy(desc(borrowers.createdAt))
        .limit(data.limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(borrowers)
        .where(where),
    ]);

    return {
      items,
      total: totalResult[0].count,
      page: data.page,
      limit: data.limit,
      totalPages: Math.ceil(totalResult[0].count / data.limit),
    };
  });

export const getBorrowerById = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => {
    const id = (data as { id: string }).id;
    if (!id) throw new Error('Borrower ID is required');
    return { id };
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requireRole(user, ['admin', 'manager']);

    const borrower = await db.query.borrowers.findFirst({
      where: eq(borrowers.id, data.id),
      with: {
        loans: {
          columns: {
            id: true,
            primaryAmount: true,
            totalRepayment: true,
            status: true,
            dateGiven: true,
          },
        },
      },
    });

    if (!borrower) throw new Error('Borrower not found');

    return borrower;
  });

export const createBorrower = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const { error, value } = createBorrowerSchema.validate(data, { abortEarly: false });
    if (error) {
      const messages = error.details.map((d) => d.message).join(', ');
      throw new Error(messages);
    }
    return value;
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requireRole(user, ['admin', 'manager']);

    // Check duplicate mobile
    const existing = await db
      .select({ id: borrowers.id })
      .from(borrowers)
      .where(eq(borrowers.mobile, data.mobile))
      .limit(1);

    if (existing.length > 0) {
      throw new Error('This mobile number is already registered');
    }

    const portalToken = randomBytes(DEFAULTS.PORTAL_TOKEN_LENGTH).toString('hex');

    const [borrower] = await db
      .insert(borrowers)
      .values({
        name: data.name,
        mobile: data.mobile,
        area: data.area || null,
        address: data.address || null,
        locationLat: data.locationLat?.toString() || null,
        locationLng: data.locationLng?.toString() || null,
        suretyType: data.suretyType || 'owner',
        suretyReferenceId: data.suretyReferenceId || null,
        aadhaarPhotoUrl: data.aadhaarPhotoUrl || null,
        profilePhotoUrl: data.profilePhotoUrl || null,
        portalToken,
        createdBy: user.id,
      })
      .returning();

    return borrower;
  });

export const updateBorrower = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const d = data as { id: string; [key: string]: unknown };
    const { id, ...rest } = d;
    if (!id) throw new Error('Borrower ID is required');
    const { error, value } = updateBorrowerSchema.validate(rest, { abortEarly: false });
    if (error) {
      const messages = error.details.map((d) => d.message).join(', ');
      throw new Error(messages);
    }
    return { id, ...value };
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requireRole(user, ['admin', 'manager']);

    const { id, ...updateData } = data;

    // If mobile changed, check duplicate
    if (updateData.mobile) {
      const existing = await db
        .select({ id: borrowers.id })
        .from(borrowers)
        .where(eq(borrowers.mobile, updateData.mobile))
        .limit(1);

      if (existing.length > 0 && existing[0].id !== id) {
        throw new Error('This mobile number is already registered');
      }
    }

    const [updated] = await db
      .update(borrowers)
      .set({
        ...updateData,
        locationLat: updateData.locationLat?.toString() || undefined,
        locationLng: updateData.locationLng?.toString() || undefined,
        updatedAt: new Date(),
      })
      .where(eq(borrowers.id, id))
      .returning();

    if (!updated) throw new Error('Borrower not found');

    return updated;
  });

export const generateNewMagicLink = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const id = (data as { id: string }).id;
    if (!id) throw new Error('Borrower ID is required');
    return { id };
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requireRole(user, ['admin', 'manager']);

    const portalToken = randomBytes(DEFAULTS.PORTAL_TOKEN_LENGTH).toString('hex');

    const [updated] = await db
      .update(borrowers)
      .set({ portalToken, updatedAt: new Date() })
      .where(eq(borrowers.id, data.id))
      .returning();

    if (!updated) throw new Error('Borrower not found');

    return { portalToken: updated.portalToken };
  });

export const searchBorrowers = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => {
    const query = (data as { query: string }).query;
    if (!query || query.length < 1) throw new Error('Search query required');
    return { query };
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requireRole(user, ['admin', 'manager']);

    const pattern = `%${data.query}%`;
    const results = await db
      .select({
        id: borrowers.id,
        name: borrowers.name,
        mobile: borrowers.mobile,
        area: borrowers.area,
      })
      .from(borrowers)
      .where(
        or(
          ilike(borrowers.name, pattern),
          ilike(borrowers.mobile, pattern),
        ),
      )
      .limit(10);

    return results;
  });

export const listAreas = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await getAuthenticatedUser();
  requireRole(user, ['admin', 'manager']);

  const areas = await db
    .selectDistinct({ area: borrowers.area })
    .from(borrowers)
    .where(sql`${borrowers.area} IS NOT NULL AND ${borrowers.area} != ''`)
    .orderBy(borrowers.area);

  return areas.map((a) => a.area!);
});
