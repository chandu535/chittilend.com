import { describe, it, expect } from 'vitest';

/**
 * The allocation rule the app, the seeder and the repair scripts all follow: money goes
 * to the earliest instalment still owing, and a loan is settled by the amount handed
 * over, not by how many months have passed.
 *
 * Kept as a pure function here so the rule itself is pinned down without a database.
 */
type Row = { due: number; paid: number; dueDate: string; waived?: boolean };

export function allocate(rows: Row[], receipts: number[], today = '2026-07-26') {
  let pool = receipts.reduce((s, r) => s + r, 0);
  const out = rows.map((r) => {
    if (r.waived) return { ...r, status: 'waived' as const };
    const take = Math.min(pool, r.due);
    pool -= take;
    const status = take >= r.due - 0.01 ? 'paid' as const
      : take > 0 ? 'partial' as const
      : r.dueDate <= today ? 'overdue' as const : 'pending' as const;
    return { ...r, paid: take, status };
  });
  if (pool > 0.01 && out.length) out[out.length - 1].paid += pool;
  return out;
}

export function isSettled(rows: ReturnType<typeof allocate>, totalRepayment: number) {
  const settled = rows.reduce((s, r) => s + (r.status === 'waived' ? r.due : r.paid), 0);
  return settled >= totalRepayment - 0.01;
}

const schedule = (n: number, due: number): Row[] =>
  Array.from({ length: n }, (_, i) => ({ due, paid: 0, dueDate: `2025-0${i + 1}-01` }));

describe('a loan is settled by amount, not by period', () => {
  it('closes when the money is in, even though the months were uneven', () => {
    // Five months of Rs 2,500. Paid 4,000 then 1,000 then 7,500 — three receipts, not five.
    const rows = allocate(schedule(5, 2500), [4000, 1000, 7500]);
    expect(isSettled(rows, 12500)).toBe(true);
    expect(rows.every((r) => r.status === 'paid')).toBe(true);
  });

  it('does not close while money is still owing, however many months have passed', () => {
    const rows = allocate(schedule(5, 2500), [2500, 2500]);
    expect(isSettled(rows, 12500)).toBe(false);
    expect(rows.filter((r) => r.status === 'paid')).toHaveLength(2);
  });

  it('carries a heavy month forward so the next one is not chased', () => {
    // Rs 7,500 in month one covers three instalments.
    const rows = allocate(schedule(5, 2500), [7500]);
    expect(rows.slice(0, 3).every((r) => r.status === 'paid')).toBe(true);
    expect(rows[3].status).toBe('overdue');   // genuinely unpaid, not a stranded surplus
  });

  it('lets a light month be made up by a heavy one', () => {
    // Short by 500 in month one, made up in month two.
    const rows = allocate(schedule(5, 2500), [2000, 3000]);
    expect(rows[0].status).toBe('paid');
    expect(rows[1].status).toBe('paid');
    expect(isSettled(rows, 12500)).toBe(false);
  });

  it('shows a part payment as partial, not as unpaid', () => {
    const rows = allocate(schedule(5, 2500), [1000]);
    expect(rows[0].status).toBe('partial');
    expect(rows[0].paid).toBe(1000);
  });

  it('keeps an overpayment on the books instead of dropping it', () => {
    const rows = allocate(schedule(5, 2500), [15000]);
    expect(rows.reduce((s, r) => s + r.paid, 0)).toBe(15000);
    expect(isSettled(rows, 12500)).toBe(true);
  });

  it('treats a waived instalment as settled without money', () => {
    const rows = schedule(5, 2500);
    rows[4].waived = true;
    const result = allocate(rows, [10000]);
    expect(isSettled(result, 12500)).toBe(true);
  });

  it('never lets the schedule claim more than the loan is worth', () => {
    // The phantom-row bug: a sixth row invented from an out-of-schedule receipt.
    const withPhantom = [...schedule(5, 2500), { due: 3000, paid: 0, dueDate: '2025-06-01' }];
    const scheduleTotal = withPhantom.reduce((s, r) => s + r.due, 0);
    expect(scheduleTotal).not.toBe(12500);

    const rows = allocate(withPhantom, [12500]);
    // Money-based settlement is right even while the schedule is wrong — which is why
    // completion must not be read off the instalment statuses alone.
    expect(isSettled(rows, 12500)).toBe(true);
    expect(rows[5].status).toBe('overdue');
  });
});
