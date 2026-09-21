/**
 * The database role the assistant connects as.
 *
 * `/ask` lets a model write SQL, which is the only way to answer a question nobody wrote a
 * function for. Until now the only thing standing between that SQL and the ledger was
 * src/server/ai/sqlGuard.ts — a check on the text, which is worth having and is not a
 * security boundary. A guard can be wrong. A permission the database does not hold cannot
 * be talked around, whatever a question says or a model decides to write.
 *
 * So this role is granted SELECT on the five business tables and nothing at all on `users`
 * or `sessions`. Those hold bcrypt hashes and live login tokens, have no bearing on a
 * question about money, and are unreachable rather than merely discouraged: a query that
 * reaches for them fails at the permission layer with the role unable to see the table.
 *
 * The statement timeout is the other half. A generated query can be valid, permitted, and
 * accidentally a cross join over two thousand payments; five seconds ends it.
 *
 * Idempotent — safe to run again to re-apply grants after a schema change adds a table.
 * Dry run unless --write.
 */
import { sql } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import { db } from '../src/server/db';

const ROLE = 'ai_readonly';

/** Everything a question about money can legitimately need. */
const READABLE = [
  'borrowers',
  'loans',
  'payments',
  'capital_pool_log',
  'collection_entries',
];

/** Named so the refusal is explicit rather than an omission someone might later "fix". */
const FORBIDDEN = ['users', 'sessions'];

const WRITE = process.argv.includes('--write');

/** Identifiers are interpolated, so they may only ever be these. */
function assertIdentifier(name: string) {
  if (!/^[a-z_][a-z0-9_]*$/.test(name)) throw new Error(`Refusing unsafe identifier: ${name}`);
}

async function main() {
  const url = new URL(process.env.DATABASE_URL!);
  const database = url.pathname.replace(/^\//, '').split('?')[0];
  console.log('database:', url.host, `(${database})`);
  console.log(WRITE ? 'MODE: WRITE\n' : 'MODE: dry run (pass --write to apply)\n');

  [ROLE, database, ...READABLE, ...FORBIDDEN].forEach(assertIdentifier);

  // PUBLIC grants would hand the new role access this script never gave it, which would
  // make the whole exercise decorative. Worth knowing before, not after.
  const publicGrants: any = await db.execute(sql`
    SELECT table_name FROM information_schema.role_table_grants
    WHERE grantee = 'PUBLIC' AND table_schema = 'public'`);
  if (publicGrants.rows.length) {
    console.log('⚠ tables granted to PUBLIC (the role would inherit these):',
      publicGrants.rows.map((r: any) => r.table_name).join(', '));
  }

  const existing: any = await db.execute(sql`SELECT 1 FROM pg_roles WHERE rolname = ${ROLE}`);
  const roleExists = existing.rows.length > 0;
  console.log(`role ${ROLE}:`, roleExists ? 'already exists — grants will be re-applied' : 'will be created');
  console.log('readable :', READABLE.join(', '));
  console.log('forbidden:', FORBIDDEN.join(', '), '(no grant, ever)');

  // 32 bytes of base64url. Printed once, here, and nowhere else.
  const password = randomBytes(24).toString('base64url');

  if (!WRITE) {
    console.log('\ndry run — nothing created');
    return;
  }

  if (!roleExists) {
    await db.execute(sql.raw(`CREATE ROLE ${ROLE} WITH LOGIN PASSWORD '${password}'`));
  } else {
    await db.execute(sql.raw(`ALTER ROLE ${ROLE} WITH LOGIN PASSWORD '${password}'`));
  }

  await db.execute(sql.raw(`GRANT CONNECT ON DATABASE ${database} TO ${ROLE}`));
  await db.execute(sql.raw(`GRANT USAGE ON SCHEMA public TO ${ROLE}`));

  /*
    Revoked first, then granted. Re-running after a table is dropped from READABLE should
    take the permission away, and a grant-only script would leave it behind — the role
    would quietly keep reading something the list says it cannot.
  */
  await db.execute(sql.raw(`REVOKE ALL ON ALL TABLES IN SCHEMA public FROM ${ROLE}`));
  for (const table of READABLE) {
    await db.execute(sql.raw(`GRANT SELECT ON ${table} TO ${ROLE}`));
  }

  // New tables must not appear to the role on their own; each one is a decision.
  await db.execute(sql.raw(
    `ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM ${ROLE}`));

  await db.execute(sql.raw(`ALTER ROLE ${ROLE} SET statement_timeout = '5s'`));
  // Belt and braces: even a permitted query cannot begin a write.
  await db.execute(sql.raw(`ALTER ROLE ${ROLE} SET default_transaction_read_only = on`));

  const granted: any = await db.execute(sql`
    SELECT table_name, privilege_type FROM information_schema.role_table_grants
    WHERE grantee = ${ROLE} ORDER BY table_name`);

  console.log(`\n✓ ${ROLE} ready`);
  console.log('  grants:', granted.rows.length
    ? granted.rows.map((r: any) => `${r.table_name}:${r.privilege_type}`).join(', ')
    : '(none)');

  const leaked = granted.rows.filter((r: any) => FORBIDDEN.includes(r.table_name));
  if (leaked.length) throw new Error(`*** ${ROLE} can read ${leaked.map((r: any) => r.table_name).join(', ')} ***`);
  console.log('  users / sessions: not readable ✓');

  const connection = `postgresql://${ROLE}:${password}@${url.host}${url.pathname}${url.search}`;
  console.log('\nAdd to your env file as AI_DATABASE_URL:\n');
  console.log(connection);
}

main().then(() => process.exit(0)).catch((e) => { console.error(String(e.message ?? e)); process.exit(1); });
