import { describe, it, expect } from 'vitest';
import {
  formatVoucherCurrency,
  formatVoucherPercent,
  formatVoucherDate,
  formatVoucherDateTime,
} from './formatters';

const idr = (n: number) => new Intl.NumberFormat('id-ID').format(n);

describe('formatVoucherCurrency', () => {
  it('formats zero, positives, and rounds decimals', () => {
    expect(formatVoucherCurrency(0)).toBe('Rp 0');
    expect(formatVoucherCurrency(50000)).toBe(`Rp ${idr(50000)}`);
    expect(formatVoucherCurrency(50000.6)).toBe(`Rp ${idr(50001)}`);
  });

  it('clamps negatives and handles null/NaN', () => {
    expect(formatVoucherCurrency(-10)).toBe('Rp 0');
    expect(formatVoucherCurrency(null)).toBe('Rp 0');
    expect(formatVoucherCurrency(undefined)).toBe('Rp 0');
    expect(formatVoucherCurrency(NaN)).toBe('Rp 0');
  });
});

describe('formatVoucherPercent', () => {
  it('rounds and clamps 0–100', () => {
    expect(formatVoucherPercent(0)).toBe('0%');
    expect(formatVoucherPercent(25)).toBe('25%');
    expect(formatVoucherPercent(25.6)).toBe('26%');
    expect(formatVoucherPercent(-10)).toBe('0%');
    expect(formatVoucherPercent(150)).toBe('100%');
  });

  it('returns "0%" for null/undefined/NaN', () => {
    expect(formatVoucherPercent(null)).toBe('0%');
    expect(formatVoucherPercent(undefined)).toBe('0%');
    expect(formatVoucherPercent(NaN)).toBe('0%');
  });
});

describe('formatVoucherDate / formatVoucherDateTime', () => {
  it('returns "-" for falsy input', () => {
    expect(formatVoucherDate(null)).toBe('-');
    expect(formatVoucherDate(undefined)).toBe('-');
    expect(formatVoucherDate('')).toBe('-');
    expect(formatVoucherDateTime(null)).toBe('-');
    expect(formatVoucherDateTime(undefined)).toBe('-');
    expect(formatVoucherDateTime('')).toBe('-');
  });

  it('delegates to formatWib* for valid ISO', () => {
    expect(formatVoucherDate('2026-04-01T00:00:00+07:00')).toBe('01/04/2026');
    expect(formatVoucherDateTime('2026-04-01T10:30:00+07:00')).toBe(
      '01/04/2026 10:30',
    );
  });
});
