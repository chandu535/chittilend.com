import { and, eq, isNull, ne, sql, type SQL } from 'drizzle-orm';
import { borrowers, loans } from './schema';

/**
 * Not in the Bin.
 *
 * Every list, count, detail read, aggregate and background sweep has to carry one of
 * these. Naming them, rather than writing `isNull(...)` at each of the sixty-odd query
 * sites, is what makes the coverage guard in `softDelete.test.ts` able to check the whole
 * surface mechanically — it looks for these identifiers.
 *
 * The exception, deliberately, is the capital pool. `capital_pool_log` records cash that
 * genuinely moved, and its `running_balance` is a stored cumulative figure that cannot be
 * recomputed. Binning a loan removes it from the books and leaves the money history
 * untouched, so the two will legitimately disagree. Anything reading that table is marked
 * `// soft-delete-exempt:` rather than filtered.
 */
export const borrowerLive = isNull(borrowers.deletedAt);
export const loanLive = isNull(loans.deletedAt);

/**
 * For a query that has joined both. A loan whose borrower is binned cannot happen through
 * the app — a borrower can only be binned once none of their loans are live — but a query
 * that joins the two should not be the thing that surfaces one if it ever does.
 */
export const loanAndBorrowerLive: SQL = and(loanLive, borrowerLive)!;

/**
 * The same predicates for hand-written correlated subqueries, which cannot use the column
 * objects because those render qualified names that do not resolve inside an aliased
 * subquery. Pass the alias used in the fragment.
 */
export const liveLoanSql = (alias = 'l') => sql.raw(`${alias}.deleted_at IS NULL`);
export const liveBorrowerSql = (alias = 'b') => sql.raw(`${alias}.deleted_at IS NULL`);

/**
 * The outer borrower row, named as literal text rather than interpolated.
 *
 * This is not a style choice. In a single-table `.select().from(borrowers)` with no join,
 * `${borrowers.id}` renders as a bare `"id"` — and inside `(SELECT ... FROM loans l ...)`
 * that resolves to `l.id`, so the correlation becomes `l.borrower_id = l.id`, which is
 * never true. The subquery then returns zero for everyone instead of failing, and every
 * rule built on those counts silently believes each borrower has no loans.
 *
 * The same trap is documented at borrowers.ts:262 where the picker's loan count hit it.
 * Naming the table explicitly is what makes these fragments correlate.
 */
const OUTER_ID = sql.raw('borrowers.id');
const OUTER_MOBILE = sql.raw('borrowers.mobile');

/**
 * Nobody else live is on this borrower's mobile.
 *
 * This is the app-side twin of the partial unique index `borrowers_mobile_idx`, and it
 * repeats that index's predicate exactly — same column, same `deleted_at IS NULL` scope.
 * Keeping it in one place is what stops the two drifting: if they disagree, the app either
 * refuses something the database would have allowed, or promises something the database
 * then rejects with a constraint error nobody can read.
 *
 * Written as a correlated fragment so it can be dropped straight into the WHERE clause of
 * an UPDATE on `borrowers`, which is where restore needs it.
 */
export const mobileFree: SQL = sql`NOT EXISTS (
  SELECT 1 FROM borrowers b2
  WHERE b2.mobile = ${OUTER_MOBILE}
    AND b2.id <> ${OUTER_ID}
    AND b2.deleted_at IS NULL
)`;

/**
 * The live borrower holding a given mobile, if any — the name that makes a refused restore
 * actionable. Correlated against the outer `borrowers` row.
 */
export const mobileHolderSql = sql<{ id: string; name: string } | null>`(
  SELECT json_build_object('id', b2.id::text, 'name', b2.name)
  FROM borrowers b2
  WHERE b2.mobile = ${OUTER_MOBILE}
    AND b2.id <> ${OUTER_ID}
    AND b2.deleted_at IS NULL
  LIMIT 1
)`;

/** Loans still in the lists for a borrower — what blocks binning them. */
export const liveLoanCountSql = sql<number>`(
  SELECT COUNT(*)::int FROM loans l WHERE l.borrower_id = ${OUTER_ID} AND l.deleted_at IS NULL
)`;

/** Every loan row that still exists for a borrower, binned included — what blocks purging. */
export const totalLoanCountSql = sql<number>`(
  SELECT COUNT(*)::int FROM loans l WHERE l.borrower_id = ${OUTER_ID}
)`;

/** Convenience for the duplicate-mobile checks on create and edit. */
export function sameLiveMobile(mobile: string, exceptId?: string): SQL {
  const clauses = [eq(borrowers.mobile, mobile), borrowerLive];
  if (exceptId) clauses.push(ne(borrowers.id, exceptId));
  return and(...clauses)!;
}
