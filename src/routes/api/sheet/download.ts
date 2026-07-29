import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { AuthError, getAuthenticatedUser } from '@/server/middleware/auth';
import { getSheetConfig } from '@/server/sheets/config';
import { XLSX_MIME, exportXlsx } from '@/server/sheets/google';
import { syncSheet } from '@/server/sheets/sync';

/**
 * The spreadsheet as an .xlsx.
 *
 * Proxied rather than linked. Sending the browser straight to Google's export URL would
 * mean the spreadsheet had to be readable by anyone holding the link, and this file is
 * every borrower's name, phone number, address and photograph — the one thing that must not
 * sit behind a URL with no login on it. Fetching it here with the service account's own
 * credentials lets the spreadsheet stay private and shared with nobody.
 *
 * A sync is attempted first so the file matches the app at the moment it is downloaded,
 * rather than at the last successful background run. It is deliberately not fatal: a stale
 * download beats no download, and the screen already shows when the last sync was.
 */
export const Route = createFileRoute('/api/sheet/download')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const user = await getAuthenticatedUser();
          if (user.role !== 'admin' && user.role !== 'manager') {
            return json({ error: 'Forbidden' }, { status: 403 });
          }
        } catch (error) {
          if (error instanceof AuthError) return json({ error: 'Unauthorized' }, { status: 401 });
          throw error;
        }

        const config = getSheetConfig();
        if (!config) {
          return json({ error: 'Google Sheets is not configured on this server' }, { status: 503 });
        }

        await syncSheet().catch(() => undefined);

        try {
          const file = await exportXlsx(config);
          const stamp = new Date().toISOString().slice(0, 10);
          return new Response(file, {
            headers: {
              'content-type': XLSX_MIME,
              'content-disposition': `attachment; filename="sripay-${stamp}.xlsx"`,
              // The file changes whenever the book does, and a cached copy of yesterday's
              // ledger is worse than a slow download.
              'cache-control': 'no-store',
            },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error('[sheet] export failed:', message);
          return json({ error: message }, { status: 502 });
        }
      },
    },
  },
});
