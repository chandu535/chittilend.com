import { describe, it, expect } from 'vitest';
import { markPaymentSchema, markWaivedSchema } from './payment';

describe('markPaymentSchema', () => {
  it('accepts valid payment data', () => {
    const { error, value } = markPaymentSchema.validate({
      paymentId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      amountPaid: 25000,
    });
    expect(error).toBeUndefined();
    expect(value.paymentMethod).toBe('cash');
  });

  it('rejects missing paymentId', () => {
    const { error } = markPaymentSchema.validate({ amountPaid: 25000 });
    expect(error).toBeDefined();
  });

  it('rejects zero amount', () => {
    const { error } = markPaymentSchema.validate({
      paymentId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      amountPaid: 0,
    });
    expect(error).toBeDefined();
  });

  it('rejects negative amount', () => {
    const { error } = markPaymentSchema.validate({
      paymentId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      amountPaid: -100,
    });
    expect(error).toBeDefined();
  });

  it('accepts all valid payment methods', () => {
    for (const method of ['cash', 'upi', 'bank_transfer', 'other']) {
      const { error } = markPaymentSchema.validate({
        paymentId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        amountPaid: 1000,
        paymentMethod: method,
      });
      expect(error).toBeUndefined();
    }
  });

  it('rejects invalid payment method', () => {
    const { error } = markPaymentSchema.validate({
      paymentId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      amountPaid: 1000,
      paymentMethod: 'bitcoin',
    });
    expect(error).toBeDefined();
  });
});

describe('markWaivedSchema', () => {
  it('requires notes for waiver', () => {
    const { error } = markWaivedSchema.validate({
      paymentId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    });
    expect(error).toBeDefined();
    expect(error!.details[0].path).toContain('notes');
  });

  it('accepts valid waiver with notes', () => {
    const { error } = markWaivedSchema.validate({
      paymentId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      notes: 'Borrower facing medical emergency',
    });
    expect(error).toBeUndefined();
  });
});
