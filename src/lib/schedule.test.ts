import { describe, it, expect } from 'vitest';
import {
  RespreadError,
  respreadSchedule,
  shiftDueDate,
  type ScheduleRow,
  type ScheduleStatus,
} from './schedule';

function row(
  installmentNumber: number,
  amountDue: number,
  amountPaid = 0,
  status: ScheduleStatus = 'pending',
): ScheduleRow {
  return { id: `p${installmentNumber}`, installmentNumber, amountDue, amountPaid, status };
}

/** Five untouched instalments of ₹10,000, the shape the app creates by default. */
const fresh = () => [row(1, 10000), row(2, 10000), row(3, 10000), row(4, 10000), row(5, 10000)];

const sumDue = (rows: { amountDue: number }[]) => rows.reduce((s, r) => s + r.amountDue, 0);

describe('respreadSchedule', () => {
  describe('the invariant', () => {
    /*
      The one that matters. scripts/repair-phantom-instalments.ts exists because an appended
      row once carried its own amount_due and turned a receipt into a debt, so this is
      checked across a wide spread of shapes rather than on one comfortable example.
    */
    it('never changes the total owed, whatever the shape', () => {
      const shapes: { name: string; rows: ScheduleRow[]; total: number }[] = [
        { name: 'nothing paid', rows: fresh(), total: 50000 },
        {
          name: 'two paid',
          rows: [row(1, 10000, 10000, 'paid'), row(2, 10000, 10000, 'paid'), row(3, 10000), row(4, 10000), row(5, 10000)],
          total: 50000,
        },
        {
          name: 'one partial',
          rows: [row(1, 10000, 10000, 'paid'), row(2, 10000, 4500, 'partial'), row(3, 10000), row(4, 10000), row(5, 10000)],
          total: 50000,
        },
        {
          name: 'a waived instalment',
          rows: [row(1, 10000, 10000, 'paid'), row(2, 10000, 0, 'waived'), row(3, 10000), row(4, 10000), row(5, 10000)],
          total: 50000,
        },
        {
          name: 'overdue rows',
          rows: [row(1, 10000, 10000, 'paid'), row(2, 10000, 0, 'overdue'), row(3, 10000, 2000, 'partial'), row(4, 10000), row(5, 10000)],
          total: 50000,
        },
        {
          name: 'a total that does not divide evenly',
          rows: [row(1, 3334), row(2, 3333), row(3, 3333)],
          total: 10000,
        },
      ];

      for (const shape of shapes) {
        for (let count = shape.rows.length + 1; count <= shape.rows.length + 6; count++) {
          const { rows } = respreadSchedule(shape.rows, count, shape.total);
          expect(sumDue(rows), `${shape.name} → ${count}`).toBeCloseTo(shape.total, 2);
          expect(rows, `${shape.name} → ${count}`).toHaveLength(count);
        }
      }
    });

    it('holds to the paisa where the division recurs', () => {
      // 10,000 over 3 is 3333.33…, which cannot be represented and must not be lost.
      const { rows } = respreadSchedule([row(1, 10000)], 3, 10000);
      expect(sumDue(rows)).toBe(10000);
    });
  });

  describe('the worked example', () => {
    it('turns 5 × ₹10,000 into 8 × ₹6,666.67 without moving the debt', () => {
      const { rows, installmentAmount } = respreadSchedule(fresh(), 8, 50000);

      expect(rows).toHaveLength(8);
      expect(installmentAmount).toBeCloseTo(6250, 2);
      expect(sumDue(rows)).toBe(50000);
      expect(rows.map((r) => r.installmentNumber)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });

    it('leaves paid instalments exactly as they were', () => {
      const existing = [
        row(1, 10000, 10000, 'paid'),
        row(2, 10000, 10000, 'paid'),
        row(3, 10000),
        row(4, 10000),
        row(5, 10000),
      ];

      const { rows } = respreadSchedule(existing, 8, 50000);
      const paid = rows.filter((r) => r.status === 'paid');

      expect(paid).toHaveLength(2);
      paid.forEach((r) => {
        expect(r.amountDue).toBe(10000);
        expect(r.changed).toBe(false);
      });

      // ₹30,000 left over six slots.
      rows.filter((r) => r.status !== 'paid').forEach((r) => expect(r.amountDue).toBeCloseTo(5000, 2));
    });

    it('does not un-forgive a waived instalment', () => {
      const existing = [row(1, 10000, 0, 'waived'), row(2, 10000), row(3, 10000)];
      const { rows } = respreadSchedule(existing, 5, 30000);

      const waived = rows.find((r) => r.status === 'waived')!;
      expect(waived.amountDue).toBe(10000);
      expect(waived.changed).toBe(false);
      expect(sumDue(rows)).toBe(30000);
    });
  });

  describe('rows that already hold money', () => {
    it('never drops an instalment below what has been paid into it', () => {
      // ₹9,500 sits in instalment 2, but an even share of the remaining pool is far less.
      const existing = [
        row(1, 10000, 10000, 'paid'),
        row(2, 10000, 9500, 'partial'),
        row(3, 10000),
        row(4, 10000),
        row(5, 10000),
      ];

      const { rows } = respreadSchedule(existing, 12, 50000);
      const held = rows.find((r) => r.id === 'p2')!;

      expect(held.amountDue).toBeGreaterThanOrEqual(9500);
      expect(sumDue(rows)).toBeCloseTo(50000, 2);
    });

    it('closes a partial instalment when its amount falls to what it holds', () => {
      const existing = [row(1, 10000, 5000, 'partial'), row(2, 10000), row(3, 10000)];
      const { rows } = respreadSchedule(existing, 20, 30000);
      const first = rows.find((r) => r.id === 'p1')!;

      expect(first.amountDue).toBe(5000);
      expect(first.status).toBe('paid');
      expect(first.changed).toBe(true);
    });

    it('keeps an overdue instalment overdue', () => {
      const existing = [row(1, 10000, 0, 'overdue'), row(2, 10000)];
      const { rows } = respreadSchedule(existing, 4, 20000);
      expect(rows.find((r) => r.id === 'p1')!.status).toBe('overdue');
    });
  });

  describe('what it refuses', () => {
    it('will not shrink a schedule', () => {
      expect(() => respreadSchedule(fresh(), 5, 50000)).toThrow(RespreadError);
      expect(() => respreadSchedule(fresh(), 3, 50000)).toThrow(RespreadError);
    });

    it('will not extend a loan that is already settled', () => {
      const settled = [1, 2, 3, 4, 5].map((n) => row(n, 10000, 10000, 'paid'));
      expect(() => respreadSchedule(settled, 8, 50000)).toThrow(/nothing left/i);
    });

    it('will not divide a pool smaller than the money already in it', () => {
      // ₹55,000 collected against a ₹50,000 loan: the unsettled row holds more than is left.
      const existing = [
        row(1, 10000, 10000, 'paid'),
        row(2, 10000, 45000, 'partial'),
      ];
      expect(() => respreadSchedule(existing, 5, 50000)).toThrow(/exceed/i);
    });

    it('will not add instalments nobody would owe anything on', () => {
      /*
        The unsettled row already holds every rupee still owing. It divides, but each added
        row would come out at ₹0 — a schedule padded with instalments that can never be
        paid. Caught because the guard asks what is left to *collect*, not what is left to
        schedule.
      */
      const existing = [row(1, 10000, 10000, 'paid'), row(2, 10000, 40000, 'partial')];
      expect(() => respreadSchedule(existing, 5, 50000)).toThrow(/nothing left/i);
    });
  });

  describe('what the caller has to write', () => {
    it('flags only the rows that actually moved', () => {
      const existing = [row(1, 10000, 10000, 'paid'), row(2, 10000), row(3, 10000)];
      const { rows } = respreadSchedule(existing, 6, 30000);

      expect(rows.filter((r) => r.isNew)).toHaveLength(3);
      expect(rows.filter((r) => !r.isNew && r.changed).map((r) => r.id)).toEqual(['p2', 'p3']);
      expect(rows.filter((r) => !r.changed).map((r) => r.id)).toEqual(['p1']);
    });

    it('numbers the new instalments after the existing ones', () => {
      const { rows } = respreadSchedule(fresh(), 8, 50000);
      expect(rows.filter((r) => r.isNew).map((r) => r.installmentNumber)).toEqual([6, 7, 8]);
    });

    it('reports what is still owed', () => {
      const existing = [row(1, 10000, 10000, 'paid'), row(2, 10000, 2500, 'partial'), row(3, 10000)];
      const { outstanding } = respreadSchedule(existing, 6, 30000);
      expect(outstanding).toBeCloseTo(17500, 2);
    });
  });
});

describe('shiftDueDate', () => {
  it('adds months', () => {
    expect(shiftDueDate('2026-07-01', 1, 'monthly')).toBe('2026-08-01');
    expect(shiftDueDate('2026-07-01', 3, 'monthly')).toBe('2026-10-01');
  });

  it('crosses the year', () => {
    expect(shiftDueDate('2026-11-01', 3, 'monthly')).toBe('2027-02-01');
    expect(shiftDueDate('2026-01-01', 24, 'monthly')).toBe('2028-01-01');
  });

  it('clamps rather than skipping a month', () => {
    // setMonth would give 3 March here, which is the bug this avoids.
    expect(shiftDueDate('2026-01-31', 1, 'monthly')).toBe('2026-02-28');
    expect(shiftDueDate('2026-08-31', 1, 'monthly')).toBe('2026-09-30');
  });

  it('adds weeks', () => {
    expect(shiftDueDate('2026-07-01', 1, 'weekly')).toBe('2026-07-08');
    expect(shiftDueDate('2026-07-29', 1, 'weekly')).toBe('2026-08-05');
  });
});
