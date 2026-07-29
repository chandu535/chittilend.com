import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { syncSheet } from '@/server/sheets/sync';

/**
 * The safety net under the mirror.
 *
 * Mutations sync the spreadsheet themselves, so in normal use this finds nothing to do and
 * costs one query. It exists for the case that has no other way out: a rebuild that failed
 * because Google was briefly unreachable leaves the change marked and nothing scheduled to
 * retry it, so without this the sheet would stay stale until somebody happened to record
 * another payment.
 *
 * Guarded by CRON_SECRET like the reminder run — the endpoint is public, and while a
 * rebuild leaks nothing, an unauthenticated way to make the server call Google in a loop is
 * a way to burn the API quota.
 */
export const Route = createFileRoute('/api/cron/sheet-sync')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = process.env.CRON_SECRET;
        if (!secret) {
          return json({ error: 'CRON_SECRET is not configured' }, { status: 500 });
        }
        if (request.headers.get('authorization') !== `Bearer ${secret}`) {
          return json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Unforced: only rebuilds if something actually marked the sheet dirty, so a
        // quarter-hourly schedule on an idle day writes nothing at all.
        const outcome = await syncSheet();
        return json(outcome, { status: outcome.status === 'failed' ? 500 : 200 });
      },
    },
  },
});
