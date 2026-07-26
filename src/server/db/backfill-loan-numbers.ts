import { neon } from '@neondatabase/serverless';

async function setup() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  console.log('Setting up loan_number column...');

  // 1. Create the sequence (safe to run multiple times)
  await sql`CREATE SEQUENCE IF NOT EXISTS loans_loan_number_seq START 1`;
  console.log('  ✓ Sequence created');

  // 2. Add the column as nullable (no default yet — avoids conflicts with existing rows)
  await sql`ALTER TABLE loans ADD COLUMN IF NOT EXISTS loan_number integer`;
  console.log('  ✓ Column added');

  // 3. Fill existing rows in created_at ASC order (all NULLs → no unique conflicts)
  await sql`
    UPDATE loans l
    SET loan_number = sub.rn
    FROM (
      SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
      FROM loans
    ) sub
    WHERE l.id = sub.id
  `;
  console.log('  ✓ Existing loans numbered by creation date');

  // 4. Advance sequence past the max assigned value so new inserts continue cleanly
  await sql`
    SELECT setval('loans_loan_number_seq', COALESCE((SELECT MAX(loan_number) FROM loans), 0))
  `;
  console.log('  ✓ Sequence advanced to correct starting point');

  // 5. Attach the sequence as the column default
  await sql`ALTER TABLE loans ALTER COLUMN loan_number SET DEFAULT nextval('loans_loan_number_seq')`;
  console.log('  ✓ Default set to nextval');

  // 6. Enforce NOT NULL
  await sql`ALTER TABLE loans ALTER COLUMN loan_number SET NOT NULL`;
  console.log('  ✓ NOT NULL constraint added');

  // 7. Unique index
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS loans_loan_number_idx ON loans(loan_number)`;
  console.log('  ✓ Unique index created');

  const [{ count }] = await sql`SELECT COUNT(*) AS count FROM loans`;
  const [{ max }] = await sql`SELECT MAX(loan_number) AS max FROM loans`;
  console.log(`\nDone. ${count} existing loans numbered 1..${max}`);
}

setup().catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});
