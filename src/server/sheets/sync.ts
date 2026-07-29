/**
 * Keeping the spreadsheet equal to the database.
 *
 * Every sync is a full rebuild of both tabs. That sounds wasteful next to patching the one
 * row that changed, and at this scale it is the opposite: one request either succeeds and
 * the sheet is exactly right, or fails and the sheet is exactly as stale as it was. There
 * is no third state where it is half-updated, and no bookkeeping of which spreadsheet row
 * belongs to which loan — the thing that makes incremental sync rot the moment a single
 * write is lost.
 *
 * The consequence worth naming: nothing here can drift. A month of failed syncs is repaired
 * by one successful one.
 */
import { and, eq, isNotNull, lt, or, isNull, sql } from 'drizzle-orm';
import { db } from '../db';
import { sheetSyncState } from '../db/schema';
import { SHEET_SYNC_ID, getSheetConfig, spreadsheetUrl } from './config';
import { writeTabs } from './google';
import { readSheetData } from './data';
import { buildTabs } from './grid';
import { afterResponse } from './afterResponse';

/**
 * How long a claimed sync may run before another attempt is allowed to take over.
 *
 * This is a lease, not a mutex. A lambda killed mid-rebuild — a deploy, a timeout, an OOM —
 * would otherwise leave `sync_started_at` set for ever and no sync could run again. Long
 * enough that a slow-but-alive rebuild is never stolen from, short enough that a dead one
 * costs a minute.
 */
const SYNC_LEASE_MS = 60_000;

export type SyncOutcome =
  | { status: 'synced'; loanRows: number; borrowerRows: number; durationMs: number }
  | { status: 'skipped'; reason: 'not-configured' | 'in-flight' | 'clean' }
  | { status: 'failed'; error: string };

/** Creates the single state row if this is the first time anything has touched it. */
async function ensureStateRow(): Promise<void> {
  await db
    .insert(sheetSyncState)
    .values({ id: SHEET_SYNC_ID })
    .onConflictDoNothing({ target: sheetSyncState.id });
}

/**
 * Records that the spreadsheet no longer matches the database.
 *
 * Called by every mutation, and deliberately says nothing about *what* changed — a full
 * rebuild does not need to know, and a schema that recorded it would need updating every
 * time a new field appeared on a form.
 *
 * One statement, not an ensure-then-update pair. This is the only sheet work left on the
 * request path, so it is the only part a user waits for, and halving its database round
 * trips halves what this feature costs them.
 */
export async function markSheetDirty(): Promise<void> {
  const now = new Date();
  await db
    .insert(sheetSyncState)
    .values({ id: SHEET_SYNC_ID, dirtyAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: sheetSyncState.id,
      set: { dirtyAt: now, updatedAt: now },
    });
}

export async function readSyncState() {
  await ensureStateRow();
  const [state] = await db
    .select()
    .from(sheetSyncState)
    .where(eq(sheetSyncState.id, SHEET_SYNC_ID))
    .limit(1);
  return state ?? null;
}

/**
 * Rebuilds both tabs, if this caller is the one that gets to.
 *
 * `force` is what the Sync now button and the setup script pass: rebuild even if nothing is
 * marked dirty, which is how a sheet someone edited or emptied by hand is put back.
 */
export async function syncSheet(options: { force?: boolean } = {}): Promise<SyncOutcome> {
  const config = getSheetConfig();
  if (!config) return { status: 'skipped', reason: 'not-configured' };

  await ensureStateRow();
  const startedAt = new Date();
  const leaseCutoff = new Date(startedAt.getTime() - SYNC_LEASE_MS);

  // Claiming the lease and reading the dirty mark are the same statement on purpose. Two
  // requests arriving together both see "dirty" if they read first and claim second, and
  // both then write the same rebuild to Google.
  const [claim] = await db
    .update(sheetSyncState)
    .set({ syncStartedAt: startedAt, updatedAt: startedAt })
    .where(
      and(
        eq(sheetSyncState.id, SHEET_SYNC_ID),
        or(isNull(sheetSyncState.syncStartedAt), lt(sheetSyncState.syncStartedAt, leaseCutoff)),
        options.force ? undefined : isNotNull(sheetSyncState.dirtyAt),
      ),
    )
    .returning({ dirtyAt: sheetSyncState.dirtyAt });

  if (!claim) {
    // Either someone else is mid-rebuild — in which case their write will include this
    // caller's change, since it is already committed — or there was nothing to do.
    const state = await readSyncState();
    const inFlight = state?.syncStartedAt && state.syncStartedAt >= leaseCutoff;
    return { status: 'skipped', reason: inFlight ? 'in-flight' : 'clean' };
  }

  try {
    const data = await readSheetData();
    const appUrl = process.env.APP_URL ?? '';
    const tabs = buildTabs(data, new Date(), appUrl, {
      loans: config.loansTab,
      borrowers: config.borrowersTab,
    });
    await writeTabs(config, tabs);

    const finishedAt = new Date();
    await db
      .update(sheetSyncState)
      .set({
        // Cleared only if nothing new arrived while this rebuild was in the air. A payment
        // marked during the write is not in the data that was just sent, so leaving the
        // flag set is what makes the next trigger pick it up instead of losing it.
        dirtyAt: sql`CASE WHEN ${sheetSyncState.dirtyAt} IS DISTINCT FROM ${claim.dirtyAt}
          THEN ${sheetSyncState.dirtyAt} ELSE NULL END`,
        syncStartedAt: null,
        syncedAt: finishedAt,
        lastError: null,
        lastDurationMs: finishedAt.getTime() - startedAt.getTime(),
        lastLoanRows: data.loans.length,
        lastBorrowerRows: data.borrowers.length,
        updatedAt: finishedAt,
      })
      .where(eq(sheetSyncState.id, SHEET_SYNC_ID));

    return {
      status: 'synced',
      loanRows: data.loans.length,
      borrowerRows: data.borrowers.length,
      durationMs: finishedAt.getTime() - startedAt.getTime(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // The lease is released and `dirty_at` is left exactly as it was, so the next mutation,
    // the next cron tick or the Sync now button retries. A failure delays the mirror; it
    // never loses a change.
    await db
      .update(sheetSyncState)
      .set({ syncStartedAt: null, lastError: message, updatedAt: new Date() })
      .where(eq(sheetSyncState.id, SHEET_SYNC_ID));

    console.error('[sheet-sync] rebuild failed:', message);
    return { status: 'failed', error: message };
  }
}

/**
 * What a mutation calls. Records the change, then gets out of the way.
 *
 * Only the dirty flag is on the request path — one statement — and the rebuild, which
 * means several seconds of talking to Google, happens after the response has gone. Nobody
 * marking a payment should wait on a spreadsheet.
 *
 * The order is the whole safety argument. `dirty_at` is committed *before* the handover, so
 * if the background run never happens — killed process, unreachable Google, a host with no
 * `waitUntil` — the change is still recorded as owed, and the next mutation or the cron
 * carries it. Deferring the mirror can delay it; it cannot lose it.
 *
 * Nothing here may throw. The spreadsheet is a copy; the borrower's payment is the real
 * event, and it must not be reported as failed because Google was having a bad minute.
 */
export async function requestSheetSync(): Promise<void> {
  try {
    await markSheetDirty();
    if (!getSheetConfig()) return;
    afterResponse(() => syncSheet());
  } catch (error) {
    console.error('[sheet-sync] could not mark a change:', error);
  }
}

export async function sheetStatus() {
  const state = await readSyncState();
  return {
    configured: getSheetConfig() !== null,
    url: spreadsheetUrl(),
    dirtyAt: state?.dirtyAt ?? null,
    syncedAt: state?.syncedAt ?? null,
    lastError: state?.lastError ?? null,
    lastDurationMs: state?.lastDurationMs ?? null,
    loanRows: state?.lastLoanRows ?? null,
    borrowerRows: state?.lastBorrowerRows ?? null,
  };
}
