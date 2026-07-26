import { readFileSync } from 'node:fs';
import { defineConfig } from 'drizzle-kit';

/**
 * Production schema config. Reads .env.prod explicitly rather than the ambient
 * environment, so a push can never silently hit the wrong database because a shell
 * happened to have DATABASE_URL set.
 *
 *   npx drizzle-kit push --config=drizzle.config.prod.ts
 */
function readEnvProd(key: string): string {
  const file = readFileSync('.env.prod', 'utf8');
  for (const line of file.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq > 0 && trimmed.slice(0, eq) === key) return trimmed.slice(eq + 1);
  }
  throw new Error(`${key} is not set in .env.prod`);
}

export default defineConfig({
  schema: './src/server/db/schema.ts',
  out: './src/server/db/migrations',
  dialect: 'postgresql',
  dbCredentials: { url: readEnvProd('DATABASE_URL') },
});
