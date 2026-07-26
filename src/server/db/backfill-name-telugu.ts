/**
 * Fills name_telugu for borrowers created before the field existed.
 *
 * Run with:  npm run db:backfill-name-telugu           (preview only)
 *            npm run db:backfill-name-telugu -- --write (apply)
 *
 * Always prints every proposed spelling. These are machine suggestions, so review
 * the output before writing, and correct anything that looks wrong from the
 * borrower's edit screen afterwards.
 */
import { isNull, eq } from 'drizzle-orm';
import { db } from './index';
import { borrowers } from './schema';
import { toTelugu, hasTeluguScript } from '../../lib/transliterate';

const ENDPOINT = 'https://inputtools.google.com/request';
const DELAY_MS = 150;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function suggest(text: string): Promise<{ value: string; source: 'google' | 'local' }> {
  const params = new URLSearchParams({
    text, itc: 'te-t-i0-und', num: '1', cp: '0', cs: '1', ie: 'utf-8', oe: 'utf-8',
  });
  try {
    const response = await fetch(`${ENDPOINT}?${params.toString()}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error(String(response.status));
    const body = (await response.json()) as [string, Array<[string, string[]]>];
    const candidate = body[0] === 'SUCCESS' ? body[1]?.[0]?.[1]?.[0] : undefined;
    if (!candidate) throw new Error('no candidate');
    return { value: candidate, source: 'google' };
  } catch {
    return { value: toTelugu(text), source: 'local' };
  }
}

async function main() {
  const write = process.argv.includes('--write');

  const pending = await db
    .select({ id: borrowers.id, name: borrowers.name })
    .from(borrowers)
    .where(isNull(borrowers.nameTelugu));

  if (pending.length === 0) {
    console.log('Nothing to backfill — every borrower already has a Telugu name.');
    return;
  }

  console.log(`${pending.length} borrower(s) without a Telugu name.`);
  console.log(write ? 'Writing changes.\n' : 'Preview only — pass --write to apply.\n');

  let fallbacks = 0;

  for (const borrower of pending) {
    // A name already stored in Telugu is its own Telugu spelling.
    const alreadyTelugu = hasTeluguScript(borrower.name);
    const { value, source } = alreadyTelugu
      ? { value: borrower.name, source: 'local' as const }
      : await suggest(borrower.name);

    // Only a machine guess is worth flagging. A name already written in Telugu is copied verbatim.
    const isGuess = source === 'local' && !alreadyTelugu;
    if (isGuess) fallbacks++;
    console.log(`${isGuess ? '?' : ' '} ${borrower.name.padEnd(28)} -> ${value}`);

    if (write) {
      await db
        .update(borrowers)
        .set({ nameTelugu: value, updatedAt: new Date() })
        .where(eq(borrowers.id, borrower.id));
    }

    if (!alreadyTelugu) await sleep(DELAY_MS);
  }

  if (fallbacks > 0) {
    console.log(`\n${fallbacks} name(s) marked "?" used the offline rules and are likely to need correction.`);
  }
  console.log(write ? '\nDone.' : '\nNo changes written.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
