import { createServerFn } from '@tanstack/react-start';
import { eq, or, sql, desc, asc, count, and } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { db } from '../db';
import { borrowers, loans } from '../db/schema';
import { createBorrowerSchema, updateBorrowerSchema } from '../validators/borrower';
import { getAuthenticatedUser } from '../middleware/auth';
import { requireRole, requirePermission } from '../middleware/roleGuard';
import { borrowerSearchCondition } from '../db/search';
import { DEFAULTS } from '@/lib/constants';

export const listBorrowers = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => {
    const d = data as {
      page?: number;
      limit?: number;
      area?: string;
      search?: string;
      searchTelugu?: string[];
    };
    return {
      page: d.page || 1,
      limit: d.limit || DEFAULTS.ITEMS_PER_PAGE,
      area: d.area || '',
      search: d.search || '',
      searchTelugu: (d.searchTelugu ?? []).filter((t) => typeof t === 'string' && t.trim()).slice(0, 3),
    };
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requireRole(user, ['admin', 'manager']);

    const offset = (data.page - 1) * data.limit;
    const conditions = [];

    const searchCondition = borrowerSearchCondition(data.search, data.searchTelugu);
    if (searchCondition) conditions.push(searchCondition);

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
            loanNumber: true,
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
    requirePermission(user, 'borrowers.write');

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
        nameTelugu: data.nameTelugu || null,
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
    requirePermission(user, 'borrowers.write');

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
        suretyReferenceId: updateData.suretyReferenceId || null,
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
    requirePermission(user, 'borrowers.write');

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
    const d = data as { query?: string; queryTelugu?: string[]; limit?: number };
    // An empty query is a valid request, not an error: the borrower picker opens showing
    // the list rather than an empty box waiting to be typed into.
    return {
      query: (d.query ?? '').trim(),
      queryTelugu: (d.queryTelugu ?? []).filter((t) => typeof t === 'string' && t.trim()).slice(0, 3),
      limit: Math.min(d.limit ?? 20, 50),
    };
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requireRole(user, ['admin', 'manager']);

    const where = borrowerSearchCondition(data.query, data.queryTelugu);

    return db
      .select({
        id: borrowers.id,
        name: borrowers.name,
        nameTelugu: borrowers.nameTelugu,
        mobile: borrowers.mobile,
        area: borrowers.area,
        profilePhotoUrl: borrowers.profilePhotoUrl,
        // The outer table is named explicitly and the inner one aliased. Interpolating
        // ${borrowers.id} here renders as bare "id" on a single-table select with no
        // join, which inside the subquery resolves to loans.id — a comparison that is
        // always false and silently counts zero rather than failing.
        loanCount: sql<number>`(SELECT COUNT(*)::int FROM loans l WHERE l.borrower_id = borrowers.id)`,
      })
      .from(borrowers)
      .where(where)
      // Busiest first when browsing, so the people you actually chase are at the top.
      .orderBy(desc(sql`(SELECT COUNT(*) FROM loans l WHERE l.borrower_id = borrowers.id)`), asc(borrowers.name))
      .limit(data.limit);
  });

export const deleteBorrower = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const id = (data as { id: string }).id;
    if (!id) throw new Error('Borrower ID is required');
    return { id };
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requirePermission(user, 'borrowers.delete');

    // Check for active loans before deleting (DB has onDelete: 'restrict')
    const activeLoans = await db
      .select({ id: loans.id })
      .from(loans)
      .where(
        and(
          eq(loans.borrowerId, data.id),
          or(eq(loans.status, 'active'), eq(loans.status, 'extended')),
        ),
      )
      .limit(1);

    if (activeLoans.length > 0) {
      throw new Error('BORROWER_HAS_ACTIVE_LOANS');
    }

    const [deleted] = await db
      .delete(borrowers)
      .where(eq(borrowers.id, data.id))
      .returning({ id: borrowers.id });

    if (!deleted) throw new Error('Borrower not found');

    return { success: true };
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
