import { describe, it, expect } from 'vitest';
import { createLoanSchema } from './loan';

const validLoan = {
  borrowerId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  dateGiven: '2025-01-15',
  primaryAmount: 100000,
};

describe('createLoanSchema', () => {
  it('accepts valid loan with defaults', () => {
    const { error, value } = createLoanSchema.validate(validLoan);
    expect(error).toBeUndefined();
    expect(value.tenureMonths).toBe(5);
    expect(value.paymentFrequency).toBe('monthly');
    expect(value.serviceChargePercent).toBe(1);
    expect(value.markupPercent).toBe(25);
  });

  it('rejects missing borrowerId', () => {
    const { error } = createLoanSchema.validate({
      dateGiven: '2025-01-15',
      primaryAmount: 100000,
    });
    expect(error).toBeDefined();
    expect(error!.details[0].path).toContain('borrowerId');
  });

  it('rejects loan amount below minimum', () => {
    const { error } = createLoanSchema.validate({
      ...validLoan,
      primaryAmount: 500,
    });
    expect(error).toBeDefined();
    expect(error!.message).toContain('1,000');
  });

  it('rejects loan amount above maximum', () => {
    const { error } = createLoanSchema.validate({
      ...validLoan,
      primaryAmount: 20_000_000,
    });
    expect(error).toBeDefined();
  });

  it('rejects negative amount', () => {
    const { error } = createLoanSchema.validate({
      ...validLoan,
      primaryAmount: -5000,
    });
    expect(error).toBeDefined();
  });

  it('rejects tenure above 60 months', () => {
    const { error } = createLoanSchema.validate({
      ...validLoan,
      tenureMonths: 61,
    });
    expect(error).toBeDefined();
  });

  it('accepts weekly frequency', () => {
    const { error, value } = createLoanSchema.validate({
      ...validLoan,
      paymentFrequency: 'weekly',
    });
    expect(error).toBeUndefined();
    expect(value.paymentFrequency).toBe('weekly');
  });

  it('rejects invalid frequency', () => {
    const { error } = createLoanSchema.validate({
      ...validLoan,
      paymentFrequency: 'daily',
    });
    expect(error).toBeDefined();
  });

  it('rejects invalid date format', () => {
    const { error } = createLoanSchema.validate({
      ...validLoan,
      dateGiven: '15/01/2025',
    });
    expect(error).toBeDefined();
  });

  it('allows notes up to 2000 chars', () => {
    const { error } = createLoanSchema.validate({
      ...validLoan,
      notes: 'Short note',
    });
    expect(error).toBeUndefined();
  });
});
