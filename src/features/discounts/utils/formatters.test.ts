import { describe, it, expect } from 'vitest';
import {
  formatDiscountCurrency,
  formatDiscountPercent,
  formatDiscountDate,
  formatDiscountDateTime,
  calcDiscountFinalPrice,
} from './formatters';

const idr = (n: number) => new Intl.NumberFormat('id-ID').format(n);

describe('formatDiscountCurrency', () => {
  it('formats zero and positive integers', () => {
    expect(formatDiscountCurrency(0)).toBe('Rp 0');
    expect(formatDiscountCurrency(99000)).toBe(`Rp ${idr(99000)}`);
  });

  it('rounds decimals', () => {
    expect(formatDiscountCurrency(99000.7)).toBe(`Rp ${idr(99001)}`);
    expect(formatDiscountCurrency(99000.4)).toBe(`Rp ${idr(99000)}`);
  });

  it('clamps negatives to 0', () => {
    expect(formatDiscountCurrency(-500)).toBe('Rp 0');
  });

  it('returns "Rp 0" for null/undefined/NaN/Infinity', () => {
    expect(formatDiscountCurrency(null)).toBe('Rp 0');
    expect(formatDiscountCurrency(undefined)).toBe('Rp 0');
    expect(formatDiscountCurrency(NaN)).toBe('Rp 0');
    expect(formatDiscountCurrency(Infinity)).toBe('Rp 0');
  });
});

describe('formatDiscountPercent', () => {
  it('rounds and clamps 0–100', () => {
    expect(formatDiscountPercent(0)).toBe('0%');
    expect(formatDiscountPercent(50)).toBe('50%');
    expect(formatDiscountPercent(100)).toBe('100%');
    expect(formatDiscountPercent(25.7)).toBe('26%');
  });

  it('clamps values outside 0–100', () => {
    expect(formatDiscountPercent(-10)).toBe('0%');
    expect(formatDiscountPercent(150)).toBe('100%');
  });

  it('returns "0%" for null/undefined/NaN', () => {
    expect(formatDiscountPercent(null)).toBe('0%');
    expect(formatDiscountPercent(undefined)).toBe('0%');
    expect(formatDiscountPercent(NaN)).toBe('0%');
  });
});

describe('formatDiscountDate / formatDiscountDateTime', () => {
  it('returns "-" for null/undefined/empty', () => {
    expect(formatDiscountDate(null)).toBe('-');
    expect(formatDiscountDate(undefined)).toBe('-');
    expect(formatDiscountDate('')).toBe('-');
    expect(formatDiscountDateTime(null)).toBe('-');
    expect(formatDiscountDateTime(undefined)).toBe('-');
    expect(formatDiscountDateTime('')).toBe('-');
  });

  it('delegates to formatWib* helpers for valid input', () => {
    expect(formatDiscountDate('2026-04-01T00:00:00+07:00')).toBe('01/04/2026');
    expect(formatDiscountDateTime('2026-04-01T10:30:00+07:00')).toBe(
      '01/04/2026 10:30',
    );
  });
});

describe('calcDiscountFinalPrice', () => {
  it('returns 0 when basePrice is 0 or negative', () => {
    expect(calcDiscountFinalPrice(0, 'percent', 10)).toBe(0);
    expect(calcDiscountFinalPrice(-100, 'percent', 10)).toBe(0);
  });

  it('applies fixed discount (basePrice - value)', () => {
    expect(calcDiscountFinalPrice(100000, 'fixed', 25000)).toBe(75000);
  });

  it('fixed: clamps to 0 when value exceeds basePrice', () => {
    expect(calcDiscountFinalPrice(10000, 'fixed', 99999)).toBe(0);
  });

  it('applies percent discount', () => {
    expect(calcDiscountFinalPrice(100000, 'percent', 10)).toBe(90000);
    expect(calcDiscountFinalPrice(100000, 'percent', 50)).toBe(50000);
    expect(calcDiscountFinalPrice(100000, 'percent', 100)).toBe(0);
  });

  it('percent: clamps negative to 0 and > 100 to 100', () => {
    expect(calcDiscountFinalPrice(100000, 'percent', -5)).toBe(100000);
    expect(calcDiscountFinalPrice(100000, 'percent', 150)).toBe(0);
  });

  it('rounds result', () => {
    expect(calcDiscountFinalPrice(99999, 'percent', 10)).toBe(89999);
  });
});
