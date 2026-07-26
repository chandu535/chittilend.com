import { createServerFn } from '@tanstack/react-start';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../db';
import { borrowers, loans, notificationLog, payments } from '../db/schema';
import { sendReminderTemplate, sendWarningTemplate } from './whatsapp';
import { getAuthenticatedUser } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';

/** Days of the month we message on. Two reminders, then one warning. */
export const REMINDER_DAYS = [5, 9] as const;
export const WARNING_DAY = 11;

/** RBI's Digital Lending Directions permit contacting a borrower only in these hours. */
const CONTACT_WINDOW = { openHour: 8, closeHour: 19 };

/** Current date and hour in IST, regardless of the server's timezone. */
export function istNow(at: Date = new Date()): { date: string; hour: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false,
  }).formatToParts(at);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  // Intl renders midnight as "24" in some engines; normalise it.
  const hour = Number(get('hour')) % 24;
  return { date: `${get('year')}-${get('month')}-${get('day')}`, hour, day: Number(get('day')) };
}

export function withinContactWindow(hour: number): boolean {
  return hour >= CONTACT_WINDOW.openHour && hour < CONTACT_WINDOW.closeHour;
}

export interface DispatchResult {
  ranAt: string;
  istDate: string;
  istHour: number;
  skipped?: string;
  /** No messages sent and nothing written — resolves who *would* be messaged. */
  dryRun: boolean;
  candidates: number;
  sent: number;
  failed: number;
  deduped: number;
  details: Array<{ loan: number; borrower: string; template: string; status: string; error?: string }>;
}

/**
 * One day's reminder run.
 *
 * Everything is gated three ways: the IST contact window, one message per borrower per
 * day, and a unique log row per (loan, template, day). The last is what makes a cron
 * retry safe — Vercel can invoke this more than once, and a redeploy can interrupt it
 * mid-run, so the send must be idempotent rather than merely careful.
 */
export async function dispatchDailyReminders(
  now: Date = new Date(),
  { dryRun = false }: { dryRun?: boolean } = {},
): Promise<DispatchResult> {
  const { date: istDate, hour, day } = istNow(now);
  const base: DispatchResult = {
    ranAt: now.toISOString(), istDate, istHour: hour, dryRun,
    candidates: 0, sent: 0, failed: 0, deduped: 0, details: [],
  };

  if (!withinContactWindow(hour)) {
    return { ...base, skipped: `outside 0800-1900 IST (hour ${hour})` };
  }

  const isReminderDay = (REMINDER_DAYS as readonly number[]).includes(day);
  const isWarningDay = day === WARNING_DAY;
  if (!isReminderDay && !isWarningDay) {
    return { ...base, skipped: `day ${day} is not a send day` };
  }

  const template = isWarningDay ? 'payment_warning' : 'payment_reminder';

  // Overdue statuses are otherwise only refreshed when a human opens the payments page,
  // so do it here before deciding who is late.
  if (!dryRun) {
    await db
      .update(payments)
      .set({ status: 'overdue', updatedAt: now })
      .where(and(eq(payments.status, 'pending'), sql`${payments.dueDate} <= ${istDate}`));
  }

  // Earliest unpaid instalment per active loan.
  const candidates = await db
    .select({
      loanId: loans.id,
      loanNumber: loans.loanNumber,
      borrowerId: borrowers.id,
      borrowerName: borrowers.name,
      mobile: borrowers.mobile,
      dueDate: payments.dueDate,
      amountDue: payments.amountDue,
      amountPaid: payments.amountPaid,
    })
    .from(loans)
    .innerJoin(borrowers, eq(loans.borrowerId, borrowers.id))
    .innerJoin(payments, eq(payments.loanId, loans.id))
    .where(and(
      inArray(loans.status, ['active', 'extended']),
      sql`${payments.status} NOT IN ('paid', 'waived')`,
      // Only the earliest open instalment on each loan.
      sql`${payments.installmentNumber} = (
        SELECT MIN(p2.installment_number) FROM payments p2
        WHERE p2.loan_id = ${loans.id} AND p2.status NOT IN ('paid','waived')
      )`,
    ));

  base.candidates = candidates.length;
  if (candidates.length === 0) return base;

  // One message per borrower per day, however many loans they hold. Where a borrower has
  // several, the largest outstanding wins — that is the one worth chasing.
  const byBorrower = new Map<string, typeof candidates[number]>();
  for (const row of candidates) {
    const outstanding = parseFloat(row.amountDue) - parseFloat(row.amountPaid);
    const held = byBorrower.get(row.borrowerId);
    const heldOutstanding = held ? parseFloat(held.amountDue) - parseFloat(held.amountPaid) : -1;
    if (!held || outstanding > heldOutstanding) byBorrower.set(row.borrowerId, row);
  }

  // Anyone already messaged today, by any template, is off limits.
  const alreadyToday = await db
    .select({ borrowerId: notificationLog.borrowerId })
    .from(notificationLog)
    .where(eq(notificationLog.scheduledFor, istDate));
  const messagedToday = new Set(alreadyToday.map((r) => r.borrowerId));

  for (const row of byBorrower.values()) {
    if (messagedToday.has(row.borrowerId)) {
      base.deduped++;
      continue;
    }
    if (!/^[6-9]\d{9}$/.test(row.mobile)) {
      base.details.push({
        loan: row.loanNumber, borrower: row.borrowerName, template, status: 'skipped',
        error: 'invalid mobile',
      });
      continue;
    }

    if (dryRun) {
      base.details.push({ loan: row.loanNumber, borrower: row.borrowerName, template, status: 'would-send' });
      messagedToday.add(row.borrowerId);
      continue;
    }

    // Claim the slot before sending. If a concurrent run already inserted this row the
    // unique index rejects it and we skip, so a double invocation cannot double-message.
    const claimed = await db
      .insert(notificationLog)
      .values({
        borrowerId: row.borrowerId,
        loanId: row.loanId,
        template,
        scheduledFor: istDate,
        status: 'pending',
      })
      .onConflictDoNothing()
      .returning({ id: notificationLog.id });

    if (claimed.length === 0) {
      base.deduped++;
      continue;
    }

    try {
      const result = isWarningDay
        ? await sendWarningTemplate(row.loanId)
        : await sendReminderTemplate(row.loanId);

      await db
        .update(notificationLog)
        .set({ status: 'sent', waMessageId: result.messageId ?? null })
        .where(eq(notificationLog.id, claimed[0].id));

      base.sent++;
      base.details.push({ loan: row.loanNumber, borrower: row.borrowerName, template, status: 'sent' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await db
        .update(notificationLog)
        .set({ status: 'failed', error: message.slice(0, 500) })
        .where(eq(notificationLog.id, claimed[0].id));

      base.failed++;
      base.details.push({
        loan: row.loanNumber, borrower: row.borrowerName, template, status: 'failed', error: message,
      });
    }

    messagedToday.add(row.borrowerId);
  }

  return base;
}

/** Recent WhatsApp sends, for the Settings view. Newest first. */
export const listNotifications = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => {
    const limit = (data as { limit?: number })?.limit;
    return { limit: Math.min(Math.max(limit ?? 50, 1), 200) };
  })
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    requireRole(user, ['admin', 'manager']);

    const rows = await db
      .select({
        id: notificationLog.id,
        template: notificationLog.template,
        scheduledFor: notificationLog.scheduledFor,
        status: notificationLog.status,
        error: notificationLog.error,
        createdAt: notificationLog.createdAt,
        borrowerName: borrowers.name,
        borrowerNameTelugu: borrowers.nameTelugu,
        loanNumber: loans.loanNumber,
      })
      .from(notificationLog)
      .innerJoin(borrowers, eq(notificationLog.borrowerId, borrowers.id))
      .leftJoin(loans, eq(notificationLog.loanId, loans.id))
      .orderBy(desc(notificationLog.createdAt))
      .limit(data.limit);

    return rows;
  });
