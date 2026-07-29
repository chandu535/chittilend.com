import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Every query that touches loans or borrowers must exclude what is in the Bin.
 *
 * There are around forty such queries across nine files, and the ones that matter most are
 * the easiest to forget: a missed filter in the reminder sweep would keep messaging a
 * borrower who was removed, and a missed filter in the portal would keep serving their
 * loans to anyone holding the old link. A checklist catches that today and nothing catches
 * it in six months, so this reads the source instead.
 *
 * The exemptions are the money ledger. `capital_pool_log` records cash that genuinely
 * moved and its running balance cannot be recomputed, so binning a loan deliberately
 * leaves it alone — see the note in softDelete.ts. Each one is marked in the source with
 * `// soft-delete-exempt: <why>`, and the full set is pinned below, so adding another
 * means editing this test and explaining yourself.
 */

const ROOT = join(__dirname, '../..');

/** Files whose every loans/borrowers query has to carry a live predicate. */
const GUARDED = [
  'server/functions/borrowers.ts',
  'server/functions/loans.ts',
  'server/functions/payments.ts',
  'server/functions/analytics.ts',
  'server/functions/portal.ts',
  'server/functions/notifications.ts',
  'server/functions/consent.ts',
  'server/functions/auth.ts',
  'server/functions/upload.ts',
  'server/functions/whatsapp.ts',
  // The Google Sheets mirror. The most important entry on this list: everywhere else a
  // missed filter shows binned data on a screen, where it can be noticed and fixed. Here it
  // writes that data into a spreadsheet that gets downloaded, mailed and kept, and no later
  // fix reaches the copies.
  'server/sheets/data.ts',
];

/** How many statements in each file may be exempt, and why. Pinned deliberately. */
const EXPECTED_EXEMPTIONS: Record<string, number> = {
  // The available-capital read and the recent-activity feed. The cashflow timeline is
  // also exempt in the source, but it only ever touches capital_pool_log, so it never
  // reaches this check and is not counted here.
  'server/functions/analytics.ts': 2,
};

/**
 * Anything that proves a statement has been narrowed to live rows.
 *
 * The `live*Where` names are here on purpose. Several queries build their filter into a
 * variable first, and a predicate hidden behind a bare name called `where` is invisible
 * both to this test and to anyone reading the query. Naming it for what it carries fixes
 * both at once — which is why those variables were renamed rather than this test being
 * taught to follow assignments.
 */
const LIVE_MARKERS = [
  'borrowerLive',
  'loanLive',
  'loanAndBorrowerLive',
  'liveLoanSql',
  'liveBorrowerSql',
  'sameLiveMobile',
  'mobileFree',
  'liveWhere',
  'liveFacetWhere',
  'liveFullWhere',
  'deletedAt',
  'deleted_at',
];

const EXEMPT_MARKER = 'soft-delete-exempt:';

/** Names a table this rule cares about — as a whole word, so `loansGiven` does not count. */
const TOUCHES_TABLES = /\b(loans|borrowers)\b/;

interface Statement {
  text: string;
  /** 1-indexed, for a failure message that can be clicked. */
  line: number;
}

/**
 * Blanks comments while preserving every byte position and newline, so line numbers in a
 * failure still point at the right place. Without this the scanner reads prose about
 * `db.delete` as a query and reports a file that is perfectly filtered.
 */
function withoutComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, (line) => ' '.repeat(line.length));
}

/**
 * Splits a file into query statements.
 *
 * A Drizzle chain runs from the `db` that starts it to the next semicolon, and none of the
 * SQL fragments in this codebase contain one — asserted below, so this stays true.
 *
 * Inserts are left out: a row being created is live by definition, so there is nothing to
 * filter. Selects, updates and deletes all need the guard.
 */
function queryStatements(source: string): Statement[] {
  const code = withoutComments(source);
  const statements: Statement[] = [];
  const pattern = /\bdb\s*\n?\s*\.(?:select|update|delete)|\bdb\.query\.\w+|\bdb\.batch/g;

  for (const match of code.matchAll(pattern)) {
    const start = match.index;
    const end = code.indexOf(';', start);
    statements.push({
      text: code.slice(start, end === -1 ? code.length : end),
      line: code.slice(0, start).split('\n').length,
    });
  }
  return statements;
}

/** The comment block immediately above a statement, where an exemption would be declared. */
function precedingComment(source: string, statement: Statement): string {
  const lines = source.split('\n').slice(0, statement.line - 1);
  const comment: string[] = [];
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line.startsWith('//') || line.startsWith('*') || line.startsWith('/*')) comment.unshift(line);
    else if (line === '') continue;
    else break;
  }
  return comment.join('\n');
}

const read = (file: string) => readFileSync(join(ROOT, file), 'utf8');

describe('soft delete is applied everywhere it has to be', () => {
  it('finds no semicolon inside a SQL fragment, which the splitter relies on', () => {
    // If this ever fails, queryStatements is truncating a chain and the guard below is
    // silently reading half a query.
    for (const file of GUARDED) {
      const fragments = read(file).match(/sql`[^`]*`/g) ?? [];
      for (const fragment of fragments) {
        expect(fragment, `${file}: SQL fragment contains a semicolon`).not.toContain(';');
      }
    }
  });

  it.each(GUARDED)('%s', (file) => {
    const source = read(file);
    const unguarded: string[] = [];
    let exemptions = 0;

    for (const statement of queryStatements(source)) {
      if (!TOUCHES_TABLES.test(statement.text)) continue;

      if (precedingComment(source, statement).includes(EXEMPT_MARKER)) {
        exemptions++;
        continue;
      }
      if (LIVE_MARKERS.some((marker) => statement.text.includes(marker))) continue;

      unguarded.push(`  ${file}:${statement.line}\n    ${statement.text.trim().split('\n')[0]}`);
    }

    expect(
      unguarded,
      `Queries touching loans/borrowers with no live predicate.\n${unguarded.join('\n')}\n\n`
      + 'Add one of the predicates from server/db/softDelete.ts, or — only for the capital '
      + 'ledger — a `// soft-delete-exempt: <why>` comment directly above, and raise the '
      + 'count in EXPECTED_EXEMPTIONS.',
    ).toEqual([]);

    expect(
      exemptions,
      `${file} declares ${exemptions} soft-delete exemptions; ${EXPECTED_EXEMPTIONS[file] ?? 0} are pinned. `
      + 'Every exemption is a query that will keep showing binned data, so changing this number '
      + 'is a decision, not a detail.',
    ).toBe(EXPECTED_EXEMPTIONS[file] ?? 0);
  });

  it('actually sees the queries — a splitter that matched nothing would pass vacuously', () => {
    const counts = GUARDED.map((file) => queryStatements(read(file))
      .filter((s) => TOUCHES_TABLES.test(s.text)).length);

    for (const [index, found] of counts.entries()) {
      expect(found, `${GUARDED[index]} yielded no statements`).toBeGreaterThan(0);
    }
    // The whole surface, so a refactor that quietly moved queries out of these files
    // shows up here rather than as a silent drop in coverage.
    expect(counts.reduce((a, b) => a + b, 0)).toBeGreaterThanOrEqual(35);
  });
});
