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
  it('returns the first of the next month', () => {
    const jan15 = new Date(2025, 0, 15); // Jan 15, 2025
    const result = calculateStartMonth(jan15);
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(1); // Feb
    expect(result.getDate()).toBe(1);
  });

  it('rolls over year boundary', () => {
    const dec20 = new Date(2025, 11, 20); // Dec 20, 2025
    const result = calculateStartMonth(dec20);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(0); // Jan
    expect(result.getDate()).toBe(1);
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
