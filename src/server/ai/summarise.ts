import { teluguNumberWords, teluguPeople } from '@/lib/teluguNumbers';

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
 * The vocabulary has to cover words the model invents, not just the schema's own: it names
 * derived columns itself, and `outstanding` — the answer to "who has not paid" — was missing
 * here, so the total came from `amount_paid` and reported what had been collected when the
 * question was about what had not.
 *
 * Money, by name. `loan_number` and `installment_number` are numeric and adding them up
 * would produce a confident, meaningless figure, so identifiers and counts are excluded
 * before anything is summed.
 */
const MONEY = /amount|total|owed|outstanding|remaining|pending|balance|paid|collected|due|profit|repayment|principal|sum|rupees/i;

/*
  Only what could collide with a money word, and nothing more.

  This list has been wrong twice, in the same direction both times — too broad, silently
  dropping a real total rather than adding a fake one. `id$` excluded `amount_paid`; `month`
  excluded `amount_owed_this_month`, which the model names itself and which held ₹67,041.
  Both produced a sentence that said how many rows and never mentioned the money.

  A column is only considered at all if it carries a money word, so `mobile` and
  `loan_number` never reach this test. What does reach it: `total_installments` is a count
  wearing the word "total", `installment_number` is an index, and the percent columns are
  rates. `installment_amount` is genuinely money and must survive, which is why the plural
  is matched and the singular is not.

  `due_date` also reaches it, carrying the word "due", and is deliberately *not* excluded
  here. The obvious patch — banning "date" and "month" — is the bug this list already had
  twice: it takes `amount_owed_this_month` with it, which is a column the model invents and
  which holds the actual answer. A date is ruled out by its value instead, in
  principalMoneyColumn, where a column holding nothing that parses as a number is skipped.
  Names are a poor way to tell an amount from a date; values are not.
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
  const nameCol = nameColumn(columns);

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

  /*
    People, when the answer is about people.

    "Who has not paid this month" comes back as one row per unpaid instalment — 73 rows for
    65 people, because somebody two months behind appears twice. Reading out the row count
    answers a question nobody asked, and overstates how many doors there are to knock on.
  */
  const count = nameCol
    ? new Set(rows.map((r) => String(r[nameCol] ?? '').trim()).filter(Boolean)).size
    : rows.length;

  /*
    One person is their name, not "one person".

    "Who owes us the most" comes back as a single row, and answering it with ఒకరు states
    the number of answers instead of the answer — with the name sitting in the table
    immediately below, which makes it worse rather than merely unhelpful. Asked for a name,
    say the name.
  */
  if (nameCol && count === 1) {
    const [only] = rowSentences(rows);
    if (only) return `${only}.`;
  }

  const parts = [nameCol ? teluguPeople(count) : `${teluguNumberWords(count)} ఫలితాలు`];

  const column = principalMoneyColumn(rows, columns);
  if (column) {
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

/**
 * The one money column worth reading out.
 *
 * A query about who has not paid comes back with amount_due, amount_paid and the
 * difference, and totalling all three produced a sentence with three totals in it and no
 * way to tell which was which — "eight results, total seven thousand five hundred, total
 * one thousand" is worse than saying nothing.
 *
 * The last one wins. Models put the figure the question actually asked for at the end of
 * the select list, after the raw columns it was derived from, so the trailing money column
 * is the answer and the ones before it are its working. Columns holding nothing numeric
 * are skipped, so a NULL-heavy derived column cannot win by position alone.
 */
function principalMoneyColumn(rows: Row[], columns: string[]): string | null {
  const candidates = columns.filter(isMoneyColumn);
  for (let i = candidates.length - 1; i >= 0; i--) {
    if (rows.some((row) => asNumber(row[candidates[i]]) !== null)) return candidates[i];
  }
  return null;
}

/** The name column of a result, for callers that need to aggregate over it. */
export function nameColumnOf(columns: string[]): string | null {
  return nameColumn(columns);
}

/** The money column worth totalling, for the same reason. */
export function moneyColumnOf(rows: Row[], columns: string[]): string | null {
  return principalMoneyColumn(rows, columns);
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

  const moneyCol = principalMoneyColumn(rows, columns);

  /*
    One line per person, not per row.

    The same borrower can hold several of the rows a query returns — two unpaid instalments,
    or two loans — and reading the name twice sounds like two different people owing two
    different amounts. Their amounts are added instead, so the line says what that person
    owes in total, which is the number a collector is going to ask them for.
  */
  const byPerson = new Map<string, number | null>();
  for (const row of rows) {
    const name = String(row[nameCol] ?? '').trim();
    if (!name) continue;

    const amount = moneyCol ? asNumber(row[moneyCol]) : null;
    const running = byPerson.get(name);
    if (!byPerson.has(name)) byPerson.set(name, amount);
    else if (amount !== null) byPerson.set(name, (running ?? 0) + amount);
  }

  return [...byPerson].map(([name, amount]) => (amount === null
    ? name
    : `${name}, ${teluguNumberWords(amount)}`));
}

/**
 * The pieces of a result, for the sentence that gets spoken.
 *
 * Computed here so the model never has to. It is handed these already written out and may
 * only repeat them.
 */
export function answerFacts(rows: Row[], override?: {
  /** True totals from an aggregate over the whole query, when the rows were capped. */
  people?: number;
  total?: number | null;
  truncated?: boolean;
}): {
  rowCount: number;
  truncated: boolean;
  countPhrase: string | null;
  totalPhrase: string | null;
  sampleNames: string[];
} {
  if (!rows.length) {
    return { rowCount: 0, truncated: false, countPhrase: null, totalPhrase: null, sampleNames: [] };
  }

  const columns = Object.keys(rows[0]);
  const nameCol = nameColumn(columns);
  const moneyCol = principalMoneyColumn(rows, columns);

  /*
    Counted over everything the question matched, not over the page that came back.

    A capped query gives a truthful page and an untruthful total, and the untruthful one is
    the part that gets spoken. Where the caller has run an aggregate over the whole query,
    its figures win.
  */
  const people = override?.people ?? (nameCol
    ? new Set(rows.map((r) => String(r[nameCol] ?? '').trim()).filter(Boolean)).size
    : rows.length);

  let total: number | null = null;
  if (moneyCol) {
    let sum = 0;
    let seen = 0;
    for (const row of rows) {
      const value = asNumber(row[moneyCol]);
      if (value !== null) { sum += value; seen++; }
    }
    // A single figure is the answer itself, not a total of anything.
    if (seen) total = sum;
  }
  if (override && 'total' in override) total = override.total ?? total;

  return {
    rowCount: override?.people ?? rows.length,
    truncated: Boolean(override?.truncated),
    countPhrase: nameCol ? teluguPeople(people) : `${teluguNumberWords(rows.length)} ఫలితాలు`,
    totalPhrase: total === null ? null : `${teluguNumberWords(total)} రూపాయలు`,
    sampleNames: nameCol
      ? [...new Set(rows.map((r) => String(r[nameCol] ?? '').trim()).filter(Boolean))].slice(0, 3)
      : [],
  };
}
