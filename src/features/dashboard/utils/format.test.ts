import { describe, it, expect } from 'vitest';
import { formatIdr, formatNumber } from './format';

const idr = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);

describe('formatIdr', () => {
  it('formats numbers with currency prefix', () => {
    expect(formatIdr(99000)).toBe(idr(99000));
    expect(formatIdr(0)).toBe(idr(0));
  });

  it('accepts numeric strings', () => {
    expect(formatIdr('50000')).toBe(idr(50000));
  });

  it('treats null/undefined as 0', () => {
    expect(formatIdr(null)).toBe(idr(0));
    expect(formatIdr(undefined)).toBe(idr(0));
  });

  it('NaN input produces NaN formatting (Intl-dependent)', () => {
    expect(formatIdr('abc')).toContain('NaN');
  });
});

describe('formatNumber', () => {
  const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n);

  it('formats numbers without currency', () => {
    expect(formatNumber(1000)).toBe(fmt(1000));
    expect(formatNumber(0)).toBe(fmt(0));
  });

  it('accepts numeric strings', () => {
    expect(formatNumber('1234567')).toBe(fmt(1234567));
  });

  it('treats null/undefined as 0', () => {
    expect(formatNumber(null)).toBe(fmt(0));
    expect(formatNumber(undefined)).toBe(fmt(0));
  });
});
