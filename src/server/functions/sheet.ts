import { createServerFn } from '@tanstack/react-start';
import { getAuthenticatedUser } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';
import { sheetStatus, syncSheet } from '../sheets/sync';

/**
 * What the Sheet screen reads and what its button calls.
 *
 * The download itself is not here: a server function returns JSON, and an .xlsx is bytes.
 * It lives at `/api/sheet/download` as a route handler, which can set a content type and
 * stream a file. Both are behind the same check.
 */

export const getSheetStatus = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await getAuthenticatedUser();
  requireRole(user, ['admin', 'manager']);
  return sheetStatus();
});

export const triggerSheetSync = createServerFn({ method: 'POST' }).handler(async () => {
  const user = await getAuthenticatedUser();
  requireRole(user, ['admin', 'manager']);

  // Forced, unlike the automatic runs. Pressing the button when the app believes the sheet
  // is already current is exactly what someone does after editing or clearing it by hand,
  // and refusing on the grounds that nothing has changed in the database would be useless
  // precisely when it is needed.
  const outcome = await syncSheet({ force: true });
  return { outcome, status: await sheetStatus() };
});
