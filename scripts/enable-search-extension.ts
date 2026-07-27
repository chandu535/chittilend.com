/**
 * Enables pg_trgm, which the borrower search needs for close-spelling matching.
 *
 *   npx tsx --env-file=.env      scripts/enable-search-extension.ts
 *   npx tsx --env-file=.env.prod scripts/enable-search-extension.ts
 *
 * Drizzle pushes tables, not extensions, so this has to be run once per database. Without
 * it every search fails on `function word_similarity does not exist` — the app cannot
 * fall back, because the alternative is exact matching, which is the thing being fixed.
 *
 * Already applied to both databases. Kept so a new one can be set up the same way, and so
 * the requirement is written down rather than remembered.
 */
import { sql } from 'drizzle-orm';
import { db } from '../src/server/db';

async function main() {
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

  // The neon-http driver returns a result object rather than an array of rows.
  const result = await db.execute(sql`SELECT word_similarity('సుబమ్మ', 'సుబ్బమ్మ')::float AS score`);
  const rows = (Array.isArray(result) ? result : (result as { rows?: unknown[] }).rows) ?? [];
  const score = Number((rows[0] as { score?: number } | undefined)?.score ?? 0);

  console.log(`pg_trgm enabled. Close spellings సుబమ్మ ~ సుబ్బమ్మ score ${score.toFixed(2)} — ${score > 0.3 ? 'matched' : 'NOT MATCHED'}`);
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
