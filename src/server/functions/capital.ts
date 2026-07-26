import { createServerFn } from '@tanstack/react-start';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { db } from '../db';
import { capitalPoolLog, loans, borrowers } from '../db/schema';
import { getAuthenticatedUser } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';

export const getCapitalBalance = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await getAuthenticatedUser();
  requireRole(user, ['admin', 'manager']);

  const lastEntry = await db
    .select({ runningBalance: capitalPoolLog.runningBalance })
    .from(capitalPoolLog)
    .orderBy(desc(capitalPoolLog.createdAt))
    .limit(1);

  return {
    balance: lastEntry.length > 0 ? parseFloat(lastEntry[0].runningBalance) : 0,
  };
});

export const getCapitalLog = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => {
    const input = data as {
      dateFrom?: string;
      dateTo?: string;
      eventType?: string;
    };
    return {
      dateFrom: input.dateFrom || null,
      dateTo: input.dateTo || null,
      eventType: input.eventType || null,
    };
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requireRole(user, ['admin', 'manager']);

    const conditions = [];

    if (data.eventType && data.eventType !== 'all') {
      conditions.push(
        eq(capitalPoolLog.eventType, data.eventType as 'investment' | 'collection' | 'disbursement'),
      );
    }

    if (data.dateFrom) {
      conditions.push(gte(capitalPoolLog.eventDate, new Date(data.dateFrom)));
    }

    if (data.dateTo) {
      const endDate = new Date(data.dateTo);
      endDate.setHours(23, 59, 59, 999);
      conditions.push(lte(capitalPoolLog.eventDate, endDate));
    }

    const result = await db
      .select({
        log: capitalPoolLog,
        loanBorrowerName: borrowers.name,
        loanBorrowerNameTelugu: borrowers.nameTelugu,
      })
      .from(capitalPoolLog)
      .leftJoin(loans, eq(capitalPoolLog.referenceLoanId, loans.id))
      .leftJoin(borrowers, eq(loans.borrowerId, borrowers.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(capitalPoolLog.createdAt))
      .limit(100);

    return result.map((r) => ({
      ...r.log,
      borrowerName: r.loanBorrowerName,
      borrowerNameTelugu: r.loanBorrowerNameTelugu,
    }));
  });

export const addInvestment = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const input = data as { amount: number; notes?: string };
    if (!input.amount || input.amount <= 0) {
      throw new Error('Investment amount must be positive');
    }
    return {
      amount: input.amount,
      notes: input.notes || null,
    };
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requireRole(user, ['admin']);

    // Get current balance
    const lastEntry = await db
      .select({ runningBalance: capitalPoolLog.runningBalance })
      .from(capitalPoolLog)
      .orderBy(desc(capitalPoolLog.createdAt))
      .limit(1);

    const currentBalance = lastEntry.length > 0
      ? parseFloat(lastEntry[0].runningBalance)
      : 0;

    const [entry] = await db.insert(capitalPoolLog).values({
      eventType: 'investment',
      amount: data.amount.toFixed(2),
      runningBalance: (currentBalance + data.amount).toFixed(2),
      notes: data.notes,
      recordedBy: user.id,
    }).returning();

    return entry;
  });
