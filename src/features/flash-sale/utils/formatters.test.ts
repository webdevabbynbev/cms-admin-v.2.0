import { describe, it, expect } from 'vitest';
import {
  formatFlashSaleCurrency,
  formatFlashSaleDateTime,
  calculateFlashSaleDiscount,
} from './formatters';

const idr = (n: number) => new Intl.NumberFormat('id-ID').format(n);

describe('formatFlashSaleCurrency', () => {
  it('formats, rounds, clamps negatives, handles null/NaN', () => {
    expect(formatFlashSaleCurrency(0)).toBe('Rp 0');
    expect(formatFlashSaleCurrency(99000)).toBe(`Rp ${idr(99000)}`);
    expect(formatFlashSaleCurrency(99000.5)).toBe(`Rp ${idr(99001)}`);
    expect(formatFlashSaleCurrency(-500)).toBe('Rp 0');
    expect(formatFlashSaleCurrency(null)).toBe('Rp 0');
    expect(formatFlashSaleCurrency(undefined)).toBe('Rp 0');
    expect(formatFlashSaleCurrency(NaN)).toBe('Rp 0');
  });
});

describe('formatFlashSaleDateTime', () => {
  it('returns "-" for falsy input', () => {
    expect(formatFlashSaleDateTime(null)).toBe('-');
    expect(formatFlashSaleDateTime(undefined)).toBe('-');
    expect(formatFlashSaleDateTime('')).toBe('-');
  });

  it('delegates to formatWibDateTime for valid input', () => {
    expect(formatFlashSaleDateTime('2026-04-01T10:30:00+07:00')).toBe(
      '01/04/2026 10:30',
    );
  });
});

describe('calculateFlashSaleDiscount', () => {
  it('returns 0 when basePrice is 0 or negative', () => {
    expect(calculateFlashSaleDiscount(0, 50000)).toBe(0);
    expect(calculateFlashSaleDiscount(-100, 50000)).toBe(0);
  });

  it('calculates percentage discount and rounds', () => {
    expect(calculateFlashSaleDiscount(100000, 75000)).toBe(25);
    expect(calculateFlashSaleDiscount(100000, 50000)).toBe(50);
    expect(calculateFlashSaleDiscount(100000, 0)).toBe(100);
    expect(calculateFlashSaleDiscount(100000, 66666)).toBe(33);
  });

  it('clamps to 0 when flashPrice exceeds basePrice', () => {
    expect(calculateFlashSaleDiscount(50000, 100000)).toBe(0);
  });

  it('returns 0 when flashPrice equals basePrice', () => {
    expect(calculateFlashSaleDiscount(100000, 100000)).toBe(0);
  });
});
