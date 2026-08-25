import { describe, it, expect } from 'vitest';
import { calculateLoan, calculateStartMonth, generatePaymentSchedule } from './calculations';

describe('calculateLoan', () => {
  it('calculates a standard 1L loan with defaults', () => {
    const result = calculateLoan(100_000);
    expect(result.primaryAmount).toBe(100_000);
    expect(result.serviceChargePercent).toBe(1);
    expect(result.serviceChargeAmount).toBe(1_000);
    expect(result.amountUserReceives).toBe(99_000);
    expect(result.markupPercent).toBe(25);
    expect(result.totalRepayment).toBe(125_000);
    expect(result.tenureMonths).toBe(5);
    expect(result.paymentFrequency).toBe('monthly');
    expect(result.totalInstallments).toBe(5);
    expect(result.installmentAmount).toBe(25_000);
    expect(result.profitAmount).toBe(25_000);
  });

  it('calculates weekly frequency (4 weeks per month)', () => {
    const result = calculateLoan(100_000, 5, 'weekly');
    expect(result.totalInstallments).toBe(20); // 5 months * 4 weeks
    expect(result.installmentAmount).toBe(6_250); // 125000 / 20
  });

  it('handles custom service charge and markup', () => {
    const result = calculateLoan(50_000, 3, 'monthly', 2, 30);
    expect(result.serviceChargeAmount).toBe(1_000); // 2% of 50K
    expect(result.amountUserReceives).toBe(49_000);
    expect(result.totalRepayment).toBe(65_000); // 50K * 1.3
    expect(result.profitAmount).toBe(15_000);
    expect(result.totalInstallments).toBe(3);
  });

  it('handles small amounts', () => {
    const result = calculateLoan(1_000);
    expect(result.serviceChargeAmount).toBe(10);
    expect(result.totalRepayment).toBe(1_250);
    expect(result.installmentAmount).toBe(250);
  });
});

describe('calculateStartMonth', () => {
  /*
    Asserted as the string that gets stored, not through getMonth().

    The local getters are why a real bug shipped past these tests: the function built a
    local-midnight date, every caller wrote it with toISOString(), and in IST that is 18:30
    the day before — so a loan given on 15 July started on 31 July. Read back with
    getMonth() in the same timezone the two mistakes cancelled and the test passed. The
    stored value is what the borrower is told, so that is what is checked.
  */
  const stored = (d: Date) => d.toISOString().slice(0, 10);

  it('returns the first of the next month', () => {
    expect(stored(calculateStartMonth(new Date(2025, 0, 15)))).toBe('2025-02-01');
  });

  it('rolls over year boundary', () => {
    expect(stored(calculateStartMonth(new Date(2025, 11, 20)))).toBe('2026-01-01');
  });

  it('does not slip a day in a timezone ahead of UTC', () => {
    // The reported case. IST is UTC+5:30, so local midnight is the previous day in UTC.
    expect(stored(calculateStartMonth(new Date(2026, 6, 15)))).toBe('2026-08-01');
  });

  it('is the same date whatever the machine is set to', () => {
    // A schedule is a set of calendar days. It cannot depend on where the server sits.
    const given = new Date(2026, 6, 15);
    const zones = ['UTC', 'Asia/Kolkata', 'America/New_York', 'Pacific/Kiritimati'];
    const seen = new Set(zones.map(() => stored(calculateStartMonth(given))));
    expect(seen.size).toBe(1);
    expect([...seen][0]).toBe('2026-08-01');
  });
});

describe('generatePaymentSchedule', () => {
  it('generates monthly schedule with correct dates', () => {
    const start = new Date(2025, 1, 1); // Feb 1, 2025
    const schedule = generatePaymentSchedule(start, 125_000, 5, 'monthly');

    expect(schedule).toHaveLength(5);
    expect(schedule[0].installmentNumber).toBe(1);
    expect(schedule[0].dueDate.getMonth()).toBe(1); // Feb
    expect(schedule[1].dueDate.getMonth()).toBe(2); // Mar
    expect(schedule[4].dueDate.getMonth()).toBe(5); // Jun (Feb=1, +4 = Jun=5)
  });

  it('generates weekly schedule with 7-day intervals', () => {
    const start = new Date(2025, 0, 6); // Jan 6, 2025 (Monday)
    const schedule = generatePaymentSchedule(start, 20_000, 4, 'weekly');

    expect(schedule).toHaveLength(4);
    expect(schedule[0].dueDate.getDate()).toBe(6);
    expect(schedule[1].dueDate.getDate()).toBe(13);
    expect(schedule[2].dueDate.getDate()).toBe(20);
    expect(schedule[3].dueDate.getDate()).toBe(27);
  });

  it('distributes remainder to last installment', () => {
    // 100003 / 3 = 33334 base, remainder = 1
    const schedule = generatePaymentSchedule(new Date(2025, 0, 1), 100_003, 3, 'monthly');
    expect(schedule[0].amountDue).toBe(33334);
    expect(schedule[1].amountDue).toBe(33334);
    expect(schedule[2].amountDue).toBe(33335); // base + remainder
  });

  it('handles evenly divisible amounts', () => {
    const schedule = generatePaymentSchedule(new Date(2025, 0, 1), 125_000, 5, 'monthly');
    const allEqual = schedule.every((p) => p.amountDue === 25_000);
    expect(allEqual).toBe(true);
  });
});

/**
 * The schedule as it reaches the database.
 *
 * Every due date is written with toISOString(), so a schedule built on local dates lands a
 * day early in any timezone ahead of UTC — which is all of India. This checks the stored
 * strings rather than the Date objects, since the strings are what the borrower is shown.
 */
describe('the dates a schedule is stored with', () => {
  const stored = (d: Date) => d.toISOString().slice(0, 10);

  it('starts on the first of the month after the loan was given', () => {
    const schedule = generatePaymentSchedule(calculateStartMonth(new Date(2026, 6, 15)), 25_000, 5, 'monthly');
    expect(schedule.map((s) => stored(s.dueDate))).toEqual([
      '2026-08-01', '2026-09-01', '2026-10-01', '2026-11-01', '2026-12-01',
    ]);
  });

  it('keeps the day of the month across a short one', () => {
    // 31 Jan + 1 month has no 31 Feb. Whatever it lands on, it must not be a day earlier
    // than the arithmetic intends.
    const schedule = generatePaymentSchedule(new Date(Date.UTC(2026, 0, 31)), 30_000, 3, 'monthly');
    const days = schedule.map((s) => stored(s.dueDate));
    expect(days[0]).toBe('2026-01-31');
    expect(new Set(days).size).toBe(3);
  });

  it('steps weekly dates exactly seven days apart', () => {
    const schedule = generatePaymentSchedule(new Date(Date.UTC(2026, 7, 1)), 12_000, 4, 'weekly');
    expect(schedule.map((s) => stored(s.dueDate))).toEqual([
      '2026-08-01', '2026-08-08', '2026-08-15', '2026-08-22',
    ]);
  });

  it('still divides the money exactly, whatever the dates do', () => {
    const schedule = generatePaymentSchedule(calculateStartMonth(new Date(2026, 6, 15)), 25_000, 3, 'monthly');
    expect(schedule.reduce((sum, s) => sum + s.amountDue, 0)).toBe(25_000);
  });
});
