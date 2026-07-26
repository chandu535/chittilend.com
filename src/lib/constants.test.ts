import { describe, it, expect } from 'vitest';
import { DEFAULTS, LIMITS, STATUS_COLORS } from './constants';

describe('DEFAULTS', () => {
  it('has correct loan defaults', () => {
    expect(DEFAULTS.TENURE_MONTHS).toBe(5);
    expect(DEFAULTS.SERVICE_CHARGE_PERCENT).toBe(1);
    expect(DEFAULTS.MARKUP_PERCENT).toBe(25);
    expect(DEFAULTS.PAYMENT_FREQUENCY).toBe('monthly');
  });

  it('has sensible file upload limits', () => {
    expect(DEFAULTS.MAX_FILE_SIZE).toBe(10 * 1024 * 1024); // 10MB
    expect(DEFAULTS.ALLOWED_IMAGE_TYPES).toContain('image/jpeg');
    expect(DEFAULTS.ALLOWED_IMAGE_TYPES).toContain('image/png');
  });
});

describe('LIMITS', () => {
  it('enforces loan amount boundaries', () => {
    expect(LIMITS.MIN_LOAN_AMOUNT).toBe(1_000);
    expect(LIMITS.MAX_LOAN_AMOUNT).toBe(10_000_000);
  });

  it('enforces tenure boundaries', () => {
    expect(LIMITS.MIN_TENURE).toBe(1);
    expect(LIMITS.MAX_TENURE).toBe(60);
  });

  it('expects 10-digit mobile number', () => {
    expect(LIMITS.MOBILE_LENGTH).toBe(10);
  });
});

describe('STATUS_COLORS', () => {
  it('has all required status keys', () => {
    const keys = Object.keys(STATUS_COLORS);
    expect(keys).toContain('active');
    expect(keys).toContain('completed');
    expect(keys).toContain('defaulted');
    expect(keys).toContain('pending');
    expect(keys).toContain('paid');
    expect(keys).toContain('partial');
    expect(keys).toContain('overdue');
    expect(keys).toContain('waived');
  });

  it('each value contains Tailwind bg and text classes', () => {
    for (const value of Object.values(STATUS_COLORS)) {
      expect(value).toMatch(/^bg-\w+-\d+ text-\w+-\d+$/);
    }
  });
});
