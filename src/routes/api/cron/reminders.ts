import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
// Messaging disabled.
// import { dispatchDailyReminders } from '@/server/functions/notifications';

/**
 * Daily reminder run, invoked by Vercel Cron.
 *
 * Vercel signs its own invocations with CRON_SECRET as a bearer token. The endpoint is
 * public, so without that check anyone could trigger a send at any hour — which is both a
 * spam vector and, outside 08:00–19:00 IST, a regulatory problem.
 *
 * Hobby-plan cron precision is ±59 minutes, so a 10:00 IST schedule can fire as late as
 * 10:59. That is why the contact-window guard lives in the dispatcher rather than being
 * assumed from the schedule.
 *
 * Nothing currently invokes this. Messaging is switched off, so the entry is out of
 * vercel.json while the endpoint and its dispatcher stay intact; restoring the run means
 * putting back `{ "path": "/api/cron/reminders", "schedule": "30 4 * * *" }` (04:30 UTC,
 * which is 10:00 IST). Recorded here rather than beside the crons array because vercel.json
 * rejects any key it does not recognise, comment-shaped or not.
 */
export const Route = createFileRoute('/api/cron/reminders')({
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

        // Messaging is switched off. The schedule is already gone from vercel.json, so
        // nothing invokes this — but the endpoint stays public behind the secret, and
        // neither a stale schedule nor a manual call may start sending.
        return json({ disabled: 'WhatsApp messaging is switched off' }, { status: 503 });

        /* dispatchDailyReminders is untouched; restoring the run is uncommenting this.
        // ?dryRun=1 resolves who would be messaged without sending or writing anything.
        const dryRun = new URL(request.url).searchParams.get('dryRun') === '1';

        try {
          const result = await dispatchDailyReminders(new Date(), { dryRun });
          return json(result);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error('[cron] reminder run failed:', message);
          return json({ error: message }, { status: 500 });
        }
        */
      },
    },
  },
});
