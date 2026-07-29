/**
 * The Google API surface this app needs, and nothing else.
 *
 * Written against the REST endpoints directly rather than pulling in `googleapis`, which is
 * a ~50MB dependency for four calls. The only thing that library would really be doing for
 * us is signing the service-account assertion, and `jose` — already here for session
 * tokens — does that in five lines.
 *
 * Cells are written through `spreadsheets.batchUpdate` with explicit `userEnteredValue`
 * rather than through the simpler `values.update`. That endpoint forces a choice between
 * RAW, which turns `=IMAGE(...)` into visible text, and USER_ENTERED, which turns a mobile
 * number into a numeric cell and eats the leading zeros of the placeholder mobiles the
 * legacy import created. Per-cell typing is the only way to have formulas *and* keep a
 * phone number a string.
 */
import { SignJWT, importPKCS8 } from 'jose';
import type { SheetConfig } from './config';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';

/**
 * `spreadsheets` writes the tabs; `drive.readonly` is only for the .xlsx export the
 * Download button serves. Both are read-write-scoped to files the service account has been
 * shared on — it can see nothing else in anyone's Drive.
 */
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.readonly',
].join(' ');

export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// ===================== TYPES =====================

/**
 * One cell. Kept deliberately narrow: a value is text, a number, a formula, or empty.
 * `grid.ts` decides which, and this file never inspects the content.
 */
export type Cell =
  | { kind: 'empty' }
  | { kind: 'text'; value: string }
  | { kind: 'number'; value: number; money?: boolean }
  /**
   * A real date, as the serial number a spreadsheet stores, shown as `11-Sep-2025`.
   *
   * Not text that merely looks like a date. Text sorts alphabetically — `11-Sep` lands
   * above `2-Oct` — and cannot be filtered by range at all, which is most of what anyone
   * opens a spreadsheet to do with a column of dates.
   */
  | { kind: 'date'; value: number }
  | { kind: 'formula'; value: string };

export const empty = (): Cell => ({ kind: 'empty' });
export const text = (value: string | null | undefined): Cell =>
  value ? { kind: 'text', value } : { kind: 'empty' };
export const num = (value: number | null | undefined): Cell =>
  value === null || value === undefined || Number.isNaN(value)
    ? { kind: 'empty' }
    : { kind: 'number', value };
export const money = (value: number | null | undefined): Cell =>
  value === null || value === undefined || Number.isNaN(value)
    ? { kind: 'empty' }
    : { kind: 'number', value, money: true };
export const formula = (value: string): Cell => ({ kind: 'formula', value });

/**
 * Day zero for a spreadsheet is 30 December 1899 — an off-by-one Lotus 1-2-3 shipped and
 * every spreadsheet since has copied on purpose, so files stay compatible.
 */
const SHEET_EPOCH_UTC = Date.UTC(1899, 11, 30);

/** A `YYYY-MM-DD` calendar date as its spreadsheet serial. */
export const date = (year: number, month: number, day: number): Cell => ({
  kind: 'date',
  // Built in UTC from the three numbers rather than from a parsed local Date, so the
  // result cannot shift a day depending on where the server happens to be running.
  value: Math.round((Date.UTC(year, month - 1, day) - SHEET_EPOCH_UTC) / 86_400_000),
});

/** A background colour, in the 0–1 channels the Sheets API expects. */
export interface Rgb {
  red: number;
  green: number;
  blue: number;
}

export interface Tab {
  name: string;
  header: string[];
  rows: Cell[][];
  /**
   * A background for whole rows, indexed alongside `rows`. Null leaves a row plain.
   *
   * Applied per cell rather than per row because the Sheets API has no row-level fill —
   * `updateCells` is where formatting lives, so a "row colour" is really every cell in it
   * carrying the same background.
   */
  rowBackgrounds?: Array<Rgb | null>;
  /** Columns to freeze alongside the header row, so identity stays visible when scrolling. */
  frozenColumns: number;
}

// ===================== AUTH =====================

interface CachedToken {
  token: string;
  expiresAt: number;
}

/**
 * Module-scoped, so a warm lambda reuses one token across many requests and a cold one
 * pays a single extra round trip. Keyed by client email in case the credentials are ever
 * swapped without a restart.
 */
const tokenCache = new Map<string, CachedToken>();

/** A minute of slack, so a token cannot expire between the check and the call using it. */
const TOKEN_SKEW_MS = 60_000;

export async function getAccessToken(config: SheetConfig): Promise<string> {
  const cached = tokenCache.get(config.clientEmail);
  if (cached && cached.expiresAt - TOKEN_SKEW_MS > Date.now()) return cached.token;

  const now = Math.floor(Date.now() / 1000);

  // A key that arrived mangled — the `\n` left unescaped, the BEGIN/END lines dropped by a
  // copy-paste, the JSON pasted whole — fails inside jose with "Invalid character", which
  // says nothing about where to look. This is the single most common way the setup goes
  // wrong, so it is worth saying what it actually means.
  let key: CryptoKey;
  try {
    key = await importPKCS8(config.privateKey, 'RS256');
  } catch {
    throw new Error(
      'GOOGLE_PRIVATE_KEY could not be read. It must be the whole `private_key` value from '
      + 'the service account JSON, including the BEGIN and END lines, in double quotes with '
      + 'its newlines written as \\n.',
    );
  }

  const assertion = await new SignJWT({ scope: SCOPES })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(config.clientEmail)
    .setSubject(config.clientEmail)
    .setAudience(TOKEN_URL)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!response.ok) {
    throw new Error(`Google rejected the service account: ${await describe(response)}`);
  }

  const body = (await response.json()) as { access_token: string; expires_in: number };
  tokenCache.set(config.clientEmail, {
    token: body.access_token,
    expiresAt: Date.now() + body.expires_in * 1000,
  });
  return body.access_token;
}

/**
 * Google's errors arrive as JSON with the useful sentence buried three levels down, and
 * the raw body is a wall of text in a log. Pulling the message out is the difference
 * between "403" and "the caller does not have permission" — which tells you the sheet was
 * never shared with the service account.
 */
async function describe(response: Response): Promise<string> {
  const body = await response.text();
  try {
    const parsed = JSON.parse(body) as {
      error?: string | { message?: string };
      error_description?: string;
    };
    if (typeof parsed.error === 'object' && parsed.error?.message) {
      return `${response.status} ${parsed.error.message}`;
    }
    if (parsed.error_description) return `${response.status} ${parsed.error_description}`;
    if (typeof parsed.error === 'string') return `${response.status} ${parsed.error}`;
  } catch {
    // Not JSON — the raw body is all there is.
  }
  return `${response.status} ${body.slice(0, 300)}`;
}

async function call<T>(
  config: SheetConfig,
  url: string,
  init?: RequestInit,
): Promise<T> {
  const token = await getAccessToken(config);
  const response = await fetch(url, {
    ...init,
    headers: {
      ...init?.headers,
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
  });
  if (!response.ok) throw new Error(await describe(response));
  return (await response.json()) as T;
}

// ===================== SHEET STRUCTURE =====================

interface SheetProperties {
  sheetId: number;
  title: string;
  gridProperties?: { rowCount?: number; columnCount?: number };
}

/**
 * The tab ids to write into, creating any that are missing.
 *
 * Runs on every sync rather than once at setup. It is one cheap read, and it means a
 * spreadsheet that has been renamed, emptied or recreated by hand repairs itself on the
 * next mutation instead of failing until someone re-runs a setup script.
 */
export async function ensureTabs(
  config: SheetConfig,
  names: string[],
): Promise<Map<string, number>> {
  const existing = await call<{ sheets?: Array<{ properties: SheetProperties }> }>(
    config,
    `${SHEETS_API}/${config.spreadsheetId}?fields=sheets.properties`,
  );

  const ids = new Map<string, number>();
  for (const sheet of existing.sheets ?? []) {
    ids.set(sheet.properties.title, sheet.properties.sheetId);
  }

  const missing = names.filter((name) => !ids.has(name));
  if (missing.length === 0) return ids;

  const created = await call<{
    replies?: Array<{ addSheet?: { properties: SheetProperties } }>;
  }>(config, `${SHEETS_API}/${config.spreadsheetId}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({
      requests: missing.map((title) => ({ addSheet: { properties: { title } } })),
    }),
  });

  for (const reply of created.replies ?? []) {
    const properties = reply.addSheet?.properties;
    if (properties) ids.set(properties.title, properties.sheetId);
  }
  return ids;
}

// ===================== WRITING =====================

const HEADER_FORMAT = {
  textFormat: { bold: true },
  backgroundColor: { red: 0.94, green: 0.95, blue: 0.96 },
};

const MONEY_FORMAT = { numberFormat: { type: 'NUMBER', pattern: '#,##0.00' } };

/** `dd` rather than `d` so a column of dates lines up: 02-Oct-2025, not 2-Oct-2025. */
const DATE_FORMAT = { numberFormat: { type: 'DATE', pattern: 'dd-mmm-yyyy' } };

function toCellData(cell: Cell, background: Rgb | null) {
  // Merged rather than either-or: a money cell in a coloured row needs both its number
  // pattern and the fill, and `fields: userEnteredFormat` replaces the format wholesale, so
  // whichever one were dropped here would simply not appear.
  const format = {
    ...(cell.kind === 'number' && cell.money ? MONEY_FORMAT : {}),
    ...(cell.kind === 'date' ? DATE_FORMAT : {}),
    ...(background ? { backgroundColor: background } : {}),
  };
  const formatted = Object.keys(format).length > 0 ? { userEnteredFormat: format } : {};

  switch (cell.kind) {
    case 'empty':
      // An explicitly empty cell, not an omitted one. `updateCells` clears what it covers,
      // so this is how a value that used to be there is actually removed — and an empty
      // cell still has to carry the row's colour, or a blank month would punch a white gap
      // through the middle of a highlighted row.
      return formatted;
    case 'text':
      return { userEnteredValue: { stringValue: cell.value }, ...formatted };
    case 'number':
    case 'date':
      return { userEnteredValue: { numberValue: cell.value }, ...formatted };
    case 'formula':
      return { userEnteredValue: { formulaValue: cell.value }, ...formatted };
  }
}

/**
 * Replaces both tabs with exactly what is given, in one request.
 *
 * The grid is resized to the data before the cells are written, and that ordering is the
 * whole trick. Resizing down is what physically removes yesterday's surplus rows — a loan
 * that went to the Bin leaves no ghost row behind — and doing it *first* means the
 * subsequent write can never overflow the grid it was sized for. Growing is the same call,
 * so a new month column needs no separate step.
 */
export async function writeTabs(config: SheetConfig, tabs: Tab[]): Promise<void> {
  const ids = await ensureTabs(config, tabs.map((tab) => tab.name));
  const requests: unknown[] = [];

  for (const tab of tabs) {
    const sheetId = ids.get(tab.name);
    if (sheetId === undefined) throw new Error(`Could not create the "${tab.name}" tab`);

    const rowCount = tab.rows.length + 1;
    const columnCount = tab.header.length;

    requests.push({
      updateSheetProperties: {
        properties: {
          sheetId,
          gridProperties: {
            // Google refuses a grid with no cells, and an empty database is a legitimate
            // state — a fresh install syncs before anything exists.
            rowCount: Math.max(rowCount, 2),
            columnCount: Math.max(columnCount, 1),
            frozenRowCount: 1,
            frozenColumnCount: tab.frozenColumns,
          },
        },
        fields:
          'gridProperties.rowCount,gridProperties.columnCount,'
          + 'gridProperties.frozenRowCount,gridProperties.frozenColumnCount',
      },
    });

    requests.push({
      updateCells: {
        range: { sheetId, startRowIndex: 0, startColumnIndex: 0 },
        // Naming both fields is what makes this a replacement rather than a merge: a cell
        // omitted from `rows` keeps neither its old value nor its old formatting.
        fields: 'userEnteredValue,userEnteredFormat',
        rows: [
          {
            values: tab.header.map((label) => ({
              userEnteredValue: { stringValue: label },
              userEnteredFormat: HEADER_FORMAT,
            })),
          },
          ...tab.rows.map((row, index) => ({
            values: row.map((cell) => toCellData(cell, tab.rowBackgrounds?.[index] ?? null)),
          })),
        ],
      },
    });
  }

  await call(config, `${SHEETS_API}/${config.spreadsheetId}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({ requests }),
  });
}

// ===================== EXPORT =====================

/**
 * The spreadsheet as a .xlsx, fetched with the service account's own credentials.
 *
 * Going through the server rather than linking the browser straight at Google is what lets
 * the spreadsheet stay private. The alternative — publishing it to anyone with the link —
 * would put every borrower's name, phone number, address and photographs behind a URL that
 * needs no login and that Google is free to index.
 */
export async function exportXlsx(config: SheetConfig): Promise<ArrayBuffer> {
  const token = await getAccessToken(config);
  const response = await fetch(
    `${DRIVE_API}/${config.spreadsheetId}/export?mimeType=${encodeURIComponent(XLSX_MIME)}`,
    { headers: { authorization: `Bearer ${token}` } },
  );
  if (!response.ok) throw new Error(await describe(response));
  return response.arrayBuffer();
}
