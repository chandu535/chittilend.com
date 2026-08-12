/**
 * Re-spreading a loan's instalments when the borrower needs more of them.
 *
 * A loan written for five months is a schedule, not a rule. Borrowers pay short some
 * months and the five slots run out with money still owed, so the schedule has to grow to
 * hold the rest. What must never grow is the debt.
 *
 * That is the whole point of this file, and it is not a hypothetical: appending a row that
 * carried its own `amount_due` is what produced the phantom instalments that
 * scripts/repair-phantom-instalments.ts had to go and delete — a September receipt became
 * a sixth instalment of ₹3,000 that the borrower had never owed, and 48 fully repaid loans
 * sat there reading "active" while the reminder cron chased people for nothing.
 *
 * So the invariant this module exists to hold is:
 *
 *     sum(amountDue) === totalRepayment, exactly, to the paisa, always.
 *
 * Adding instalments divides the same debt into more, smaller pieces. It never creates a
 * rupee. Completion is then a question about money — is the total in? — which is what
 * syncLoanStatus already asks, and the reason it keeps agreeing with this.
 *
 * Pure and database-free on purpose, like calculations.ts: the arithmetic that decides what
 * someone owes is worth pinning down in tests that cannot be affected by a query.
 */

/** A settled instalment keeps its amount. Everything else is free to be re-spread. */
export type ScheduleStatus = 'pending' | 'paid' | 'partial' | 'overdue' | 'waived';

export interface ScheduleRow {
  id: string;
  installmentNumber: number;
  amountDue: number;
  amountPaid: number;
  status: ScheduleStatus;
}

export interface RespreadRow {
  id: string;
  installmentNumber: number;
  amountDue: number;
  amountPaid: number;
  status: ScheduleStatus;
  /** True for rows this call invents. They have no id yet. */
  isNew: boolean;
  /** False when the row came out exactly as it went in, so the caller can skip writing it. */
  changed: boolean;
}

export interface RespreadResult {
  rows: RespreadRow[];
  /** The even share the flexible rows now carry, and what the loan's own figure becomes. */
  installmentAmount: number;
  /** What is still owed across the whole loan after the re-spread. */
  outstanding: number;
}

/** Money is compared in paisa, so half a paisa of float drift never decides anything. */
const EPSILON = 0.005;

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * A settled row is one whose amount is no longer negotiable.
 *
 * Waived is settled at its full amount — forgiving an instalment is a decision about that
 * instalment, and re-spreading would quietly un-forgive part of it. Paid is settled because
 * the money is in.
 */
function isSettled(row: { status: ScheduleStatus }): boolean {
  return row.status === 'paid' || row.status === 'waived';
}

/**
 * Recomputes a row's status from its own numbers.
 *
 * Only ever called for rows whose amount changed. A partial row can become paid here, which
 * is correct and is the pleasant case: lowering what was owed to what was already handed
 * over closes the instalment. Nothing is ever demoted out of `paid`, since money does not
 * un-arrive; `overdue` is left alone rather than reset to `pending`, because a re-spread
 * does not make a missed date unmissed.
 */
function statusFor(row: { amountDue: number; amountPaid: number; status: ScheduleStatus }): ScheduleStatus {
  if (row.status === 'waived') return 'waived';
  if (row.amountPaid >= row.amountDue - EPSILON) return 'paid';
  if (row.amountPaid > EPSILON) return 'partial';
  return row.status === 'overdue' ? 'overdue' : 'pending';
}

export class RespreadError extends Error {}

/**
 * Divides the outstanding balance across the unsettled instalments and however many new
 * ones are being added.
 *
 * `totalCount` is the number of instalments the loan should end up with, not the number
 * being added — the caller works in absolute terms because that is what the screen shows
 * ("5 → 8") and it makes a repeated request idempotent rather than additive.
 *
 * Two rules shape the arithmetic beyond the invariant:
 *
 * A settled row is never touched, so history is not rewritten. A borrower who was told they
 * owed ₹10,000 in July and paid it still owes ₹10,000 in July afterwards.
 *
 * No row's amount is dropped below what has already been paid into it. An instalment
 * holding ₹5,000 against a new share of ₹3,000 would otherwise read as overpaid, and the
 * overpayment would be double-counted — once in that row and once in the share it was
 * excluded from. Those rows are pinned at what they hold and the rest is re-divided around
 * them, which is why this is a loop rather than one division.
 */
export function respreadSchedule(
  existing: ScheduleRow[],
  totalCount: number,
  totalRepayment: number,
): RespreadResult {
  const ordered = [...existing].sort((a, b) => a.installmentNumber - b.installmentNumber);

  if (totalCount <= ordered.length) {
    throw new RespreadError(`Instalments must be more than the current ${ordered.length}`);
  }

  const settledDue = ordered.filter(isSettled).reduce((sum, r) => sum + r.amountDue, 0);
  const pool = round2(totalRepayment - settledDue);

  // The rows free to be re-spread: everything unsettled, plus the ones being added.
  const flexible = ordered.filter((r) => !isSettled(r));
  const added = totalCount - ordered.length;
  const slots: { row: ScheduleRow | null; floor: number }[] = [
    ...flexible.map((row) => ({ row, floor: row.amountPaid })),
    ...Array.from({ length: added }, () => ({ row: null, floor: 0 })),
  ];

  const floorTotal = slots.reduce((sum, s) => sum + s.floor, 0);
  if (floorTotal > pool + EPSILON) {
    // More has been paid into the unsettled rows than is left owing on the loan. That is an
    // overpayment, and dividing a smaller pool across it would have to take money back off
    // somebody's instalment. It needs a person, not an algorithm.
    throw new RespreadError('Payments already exceed the outstanding balance');
  }

  /*
    Nothing genuinely left to collect. Both readings of that are refused here: a loan whose
    instalments are all settled, and one whose unsettled rows already hold every rupee still
    owing. The second is the interesting one — it divides cleanly, but every added row comes
    out at ₹0, so the schedule grows by instalments nobody will ever pay. Empty rows on a
    ledger are the sort of thing somebody later has to write a repair script for.
  */
  if (pool - floorTotal <= EPSILON) {
    throw new RespreadError('This loan has nothing left to schedule');
  }

  /*
    Water-filling. Share the pool evenly, and each time a slot's floor turns out to be above
    its share, pin that slot and divide what is left across the rest. Removing a slot raises
    everyone else's share, which can push a second slot under its own floor, so this repeats
    until a pass changes nothing. It terminates because every pass either pins a slot — and
    there are finitely many — or stops.
  */
  const pinned = new Set<number>();
  let share = 0;

  for (;;) {
    const free = slots.map((_, i) => i).filter((i) => !pinned.has(i));
    if (free.length === 0) break;

    const pinnedTotal = [...pinned].reduce((sum, i) => sum + slots[i].floor, 0);
    share = (pool - pinnedTotal) / free.length;

    const under = free.filter((i) => slots[i].floor > share + EPSILON);
    if (under.length === 0) break;
    under.forEach((i) => pinned.add(i));
  }

  const amounts = slots.map((slot, i) => (pinned.has(i) ? slot.floor : share)).map(round2);

  /*
    Rounding lands on the last flexible slot, the same way generatePaymentSchedule puts its
    remainder on the final instalment. Two paisa either way is not interesting; a total that
    does not equal totalRepayment is the entire failure mode this file exists to prevent, so
    it is corrected rather than tolerated.
  */
  const drift = round2(pool - amounts.reduce((sum, a) => sum + a, 0));
  if (Math.abs(drift) > 0) {
    const last = amounts.length - 1;
    amounts[last] = round2(amounts[last] + drift);
  }

  const rows: RespreadRow[] = [];

  for (const row of ordered) {
    if (isSettled(row)) {
      rows.push({ ...row, isNew: false, changed: false });
    }
  }

  slots.forEach((slot, i) => {
    const amountDue = amounts[i];

    if (slot.row) {
      const next = { ...slot.row, amountDue };
      rows.push({
        ...next,
        status: statusFor(next),
        isNew: false,
        changed: Math.abs(slot.row.amountDue - amountDue) > EPSILON
          || statusFor(next) !== slot.row.status,
      });
      return;
    }

    rows.push({
      id: '',
      installmentNumber: 0, // assigned below, once the full order is known
      amountDue,
      amountPaid: 0,
      status: 'pending',
      isNew: true,
      changed: true,
    });
  });

  rows.sort((a, b) => {
    if (a.isNew !== b.isNew) return a.isNew ? 1 : -1;
    return a.installmentNumber - b.installmentNumber;
  });
  rows.forEach((row, i) => {
    if (row.isNew) row.installmentNumber = i + 1;
  });

  const outstanding = round2(
    rows.reduce((sum, r) => sum + (r.status === 'waived' ? 0 : r.amountDue - r.amountPaid), 0),
  );

  return { rows, installmentAmount: round2(share), outstanding };
}

/**
 * The due date `offset` periods after `from`.
 *
 * Month arithmetic is done on the calendar parts rather than by adding to a Date, because
 * `setMonth` on the 31st of a month rolls into the one after next. Every schedule here
 * starts on the 1st (see calculateStartMonth) so this has never bitten, but appended rows
 * take their date from whatever the last row holds, which is a wider door than that.
 */
export function shiftDueDate(from: string, offset: number, frequency: 'monthly' | 'weekly'): string {
  const [y, m, d] = from.split('-').map(Number);

  if (frequency === 'weekly') {
    const date = new Date(Date.UTC(y, m - 1, d));
    date.setUTCDate(date.getUTCDate() + offset * 7);
    return date.toISOString().slice(0, 10);
  }

  const monthIndex = (m - 1) + offset;
  const year = y + Math.floor(monthIndex / 12);
  const month = ((monthIndex % 12) + 12) % 12;
  // Clamped, so the 31st of a 30-day month is the 30th rather than the 1st of the next.
  const day = Math.min(d, new Date(Date.UTC(year, month + 1, 0)).getUTCDate());

  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
