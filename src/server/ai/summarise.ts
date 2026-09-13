import { teluguNumberWords } from '@/lib/teluguNumbers';

/**
 * Describing a result set, without letting a model near the arithmetic.
 *
 * This was a model call once, with "use ONLY the numbers given, never calculate" in its
 * instructions. It calculated anyway. Eight instalments of ₹2,500 came back as a total of
 * ₹57,191, and the same question phrased differently produced ₹2,03,620 — both stated in
 * fluent Telugu, both confident, both invented. The rows on screen were correct throughout,
 * which is what makes it dangerous: the spoken answer is the part a collector acts on, and
 * it was the part that was wrong.
 *
 * So the sentence is built here instead. It is less fluent than a model would write and it
 * cannot be wrong, which for money is the right trade. Counting and adding are the only two
 * operations, both done in JavaScript over the rows Postgres returned.
 *
 * The model still writes the SQL. That is a different kind of task — a wrong query is
 * visible as a wrong query, and it is shown on screen for exactly that reason. Arithmetic
 * has no such tell.
 */

type Cell = string | number | boolean | null;
type Row = Record<string, Cell>;

/**
 * Columns worth totalling.
 *
 * Money, by name. `loan_number` and `installment_number` are numeric and adding them up
 * would produce a confident, meaningless figure, so identifiers and counts are excluded
 * before anything is summed.
 */
const MONEY = /amount|total|owed|balance|paid|due|profit|repayment|principal/i;

/*
  Only what could collide with a money word, and nothing more.

  This list has been wrong twice, in the same direction both times — too broad, silently
  dropping a real total rather than adding a fake one. `id$` excluded `amount_paid`; `month`
  excluded `amount_owed_this_month`, which the model names itself and which held ₹67,041.
  Both produced a sentence that said how many rows and never mentioned the money.

  A column is only considered at all if it carries a money word, so `start_month`,
  `tenure_months`, `mobile` and `loan_number` never reach this test. What does reach it:
  `total_installments` is a count wearing the word "total", `installment_number` is an
  index, and the percent columns are rates. `installment_amount` is genuinely money and
  must survive, which is why the plural is matched and the singular is not.
*/
const NOT_MONEY = /number|count|percent|installments|(^|_)id$|_id$/i;

function isMoneyColumn(name: string): boolean {
  return MONEY.test(name) && !NOT_MONEY.test(name);
}

/** Postgres returns numerics as strings, so this accepts both and rejects everything else. */
function asNumber(value: Cell): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || !/^-?\d+(\.\d+)?$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function summariseRows(rows: Row[]): string {
  if (!rows.length) return 'ఏమీ దొరకలేదు.';

  const columns = Object.keys(rows[0]);

  /*
    A single number is the whole answer, not a row count. "ఎంత మంది అప్పుదారులు ఉన్నారు"
    comes back as one row holding 16, and "పదహారు" is the answer to that question —
    saying "one result" would be true and useless.
  */
  if (rows.length === 1 && columns.length === 1) {
    const only = asNumber(rows[0][columns[0]]);
    if (only !== null) {
      return isMoneyColumn(columns[0])
        ? `${teluguNumberWords(only)} రూపాయలు.`
        : `${teluguNumberWords(only)}.`;
    }
    const text = rows[0][columns[0]];
    if (text !== null && text !== undefined) return `${String(text)}.`;
  }

  const parts = [`${teluguNumberWords(rows.length)} ఫలితాలు`];

  // Totals for every money column, added here rather than described to a model.
  for (const column of columns.filter(isMoneyColumn)) {
    let sum = 0;
    let seen = 0;
    for (const row of rows) {
      const value = asNumber(row[column]);
      if (value !== null) { sum += value; seen++; }
    }
    // One value is not a total; the row itself already says it.
    if (seen > 1) parts.push(`మొత్తం ${teluguNumberWords(sum)} రూపాయలు`);
  }

  return `${parts.join(', ')}.`;
}

/** Where a person's name might be, most Telugu-ish first. */
const NAME_COLUMNS = ['name_telugu', 'borrower_name_telugu', 'name', 'borrower_name'];

function nameColumn(columns: string[]): string | null {
  for (const candidate of NAME_COLUMNS) {
    const found = columns.find((c) => c.toLowerCase() === candidate);
    if (found) return found;
  }
  return columns.find((c) => /name/i.test(c)) ?? null;
}

/**
 * The rows, one spoken line each.
 *
 * The summary says how many and how much, and that was all this used to produce — on the
 * reasoning that eighty names read aloud are impossible to follow. That reasoning was about
 * the wrong person. Somebody who asks "who has not paid" and cannot read the screen has been
 * told nothing by a count; the list *is* the answer, and the length of it is theirs to
 * manage by asking a narrower question.
 *
 * So: name, then amount where there is one. Nothing else — no loan number, no due date. A
 * spoken line has to be short enough to hold while the next one arrives.
 */
export function rowSentences(rows: Row[]): string[] {
  if (!rows.length) return [];

  const columns = Object.keys(rows[0]);
  const nameCol = nameColumn(columns);
  if (!nameCol) return [];

  const moneyCol = columns.find(isMoneyColumn) ?? null;

  return rows.flatMap((row) => {
    const name = row[nameCol];
    if (name === null || name === undefined || String(name).trim() === '') return [];

    const amount = moneyCol ? asNumber(row[moneyCol]) : null;
    return [amount === null
      ? String(name).trim()
      : `${String(name).trim()}, ${teluguNumberWords(amount)}`];
  });
}
