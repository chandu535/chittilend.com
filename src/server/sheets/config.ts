/**
 * Credentials for the Google Sheets mirror.
 *
 * Everything here is optional by design. The whole feature is inert without credentials —
 * the screen says so, mutations skip the sync silently, and nothing throws — so the app
 * runs unchanged on a machine that has never been told about Google.
 */

export type SheetType = 'dev' | 'prod';

export interface SheetConfig {
  clientEmail: string;
  privateKey: string;
  spreadsheetId: string;
  type: SheetType;
  loansTab: string;
  borrowersTab: string;
}

/**
 * Which set of tabs this deployment owns.
 *
 * Dev and production point at the same spreadsheet and write to different tabs —
 * `loans-dev` and `borrowers-dev` beside `loans` and `borrowers` — so the real book and
 * whatever is being tried out sit side by side without either touching the other. A sync
 * rewrites only its own two tabs and resizes only its own grids.
 *
 * **Anything other than an explicit `prod` is treated as dev**, and the asymmetry is
 * deliberate. Forgetting the variable in production writes real data into the dev tabs,
 * which is untidy and fixed by one re-sync. Defaulting the other way would let a laptop
 * with a half-filled .env overwrite the live ledger, which is not fixed by anything.
 */
export function getSheetType(): SheetType {
  return process.env.GOOGLE_SHEET_TYPE?.trim().toLowerCase() === 'prod' ? 'prod' : 'dev';
}

function tabNames(type: SheetType) {
  const suffix = type === 'prod' ? '' : '-dev';
  return { loansTab: `loans${suffix}`, borrowersTab: `borrowers${suffix}` };
}

/** The single row in `sheet_sync_state`. */
export const SHEET_SYNC_ID = 'default';

/**
 * A private key travels through .env as one line with literal `\n` in it, because a real
 * newline would end the variable. Every deployment target does this, so undoing it here is
 * expected rather than a workaround — without it `importPKCS8` rejects the key with an
 * error that says nothing about newlines.
 */
function normalisePrivateKey(raw: string): string {
  return raw.replace(/\\n/g, '\n').trim();
}

export function getSheetConfig(): SheetConfig | null {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!clientEmail || !privateKey || !spreadsheetId) return null;

  const type = getSheetType();

  return {
    clientEmail,
    privateKey: normalisePrivateKey(privateKey),
    spreadsheetId,
    type,
    ...tabNames(type),
  };
}

export function isSheetConfigured(): boolean {
  return getSheetConfig() !== null;
}

/** Where the Open in Google Sheets button points. */
export function spreadsheetUrl(): string | null {
  const config = getSheetConfig();
  return config ? `https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/edit` : null;
}
