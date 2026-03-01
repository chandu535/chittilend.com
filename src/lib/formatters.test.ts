import { describe, it, expect } from 'vitest';
import {
  formatNumber,
  formatINR,
  formatINRDecimal,
  formatINRCompact,
  formatPhone,
  formatPercent,
} from './formatters';

describe('formatNumber', () => {
  it('formats number in Indian style for English', () => {
    const result = formatNumber(1234567, { lang: 'en' });
    expect(result).toBe('12,34,567');
  });

  it('returns em dash for NaN', () => {
    expect(formatNumber(NaN, { lang: 'en' })).toBe('—');
    expect(formatNumber('abc', { lang: 'en' })).toBe('—');
  });

  it('handles string input', () => {
    const result = formatNumber('50000', { lang: 'en' });
    expect(result).toBe('50,000');
  });
});

describe('formatINR', () => {
  it('formats currency in Indian Rupees for English', () => {
    const result = formatINR(100000, { lang: 'en' });
    expect(result).toContain('1,00,000');
    expect(result).toContain('₹');
  });

  it('returns ₹— for NaN', () => {
    expect(formatINR(NaN, { lang: 'en' })).toBe('₹—');
    expect(formatINR('invalid', { lang: 'en' })).toBe('₹—');
  });

  it('formats without decimals', () => {
    const result = formatINR(12345.67, { lang: 'en' });
    // Should round, no decimal places
    expect(result).not.toContain('.');
  });
});

describe('formatINRDecimal', () => {
  it('includes 2 decimal places', () => {
    const result = formatINRDecimal(12345, { lang: 'en' });
    expect(result).toContain('.00');
  });

  it('returns ₹— for NaN', () => {
    expect(formatINRDecimal('bad', { lang: 'en' })).toBe('₹—');
  });
});

describe('formatINRCompact', () => {
  it('formats lakhs for English', () => {
    const result = formatINRCompact(250000, { lang: 'en' });
    expect(result).toContain('2.5');
    expect(result).toContain('Lakhs');
  });

  it('formats crores for English', () => {
    const result = formatINRCompact(10000000, { lang: 'en' });
    expect(result).toContain('Crore');
  });

  it('formats thousands', () => {
    const result = formatINRCompact(5000, { lang: 'en' });
    expect(result).toContain('5');
    expect(result).toContain('K');
  });

  it('falls back to formatINR for small amounts', () => {
    const result = formatINRCompact(500, { lang: 'en' });
    expect(result).toContain('500');
    expect(result).toContain('₹');
  });

  it('returns ₹— for NaN', () => {
    expect(formatINRCompact(NaN, { lang: 'en' })).toBe('₹—');
  });
});

describe('formatPhone', () => {
  it('formats 10-digit mobile with space', () => {
    expect(formatPhone('9876543210')).toBe('98765 43210');
  });

  it('returns unchanged if not matching pattern', () => {
    expect(formatPhone('12345')).toBe('12345');
  });
});

describe('formatPercent', () => {
  it('formats percentage for English', () => {
    const result = formatPercent(25, { lang: 'en' });
    expect(result).toContain('25');
    expect(result).toContain('%');
  });

  it('formats fractional percentage', () => {
    const result = formatPercent(33.3, { lang: 'en' });
    expect(result).toContain('33.3');
    expect(result).toContain('%');
  });
});
