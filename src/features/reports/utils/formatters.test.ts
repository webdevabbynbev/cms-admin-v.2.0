import { describe, it, expect } from 'vitest';
import { formatIDR, formatNumber } from './formatters';

const idr = (n: number) => new Intl.NumberFormat('id-ID').format(n);

describe('formatIDR', () => {
  it('formats numbers with "Rp " prefix', () => {
    expect(formatIDR(0)).toBe('Rp 0');
    expect(formatIDR(99000)).toBe(`Rp ${idr(99000)}`);
  });

  it('rounds and clamps negatives', () => {
    expect(formatIDR(99000.6)).toBe(`Rp ${idr(99001)}`);
    expect(formatIDR(-50)).toBe('Rp 0');
  });

  it('treats null/undefined/non-numeric as 0', () => {
    expect(formatIDR(null)).toBe('Rp 0');
    expect(formatIDR(undefined)).toBe('Rp 0');
    // @ts-expect-error runtime-only check
    expect(formatIDR('abc')).toBe('Rp 0');
  });
});

describe('formatNumber', () => {
  it('formats integers and rounds', () => {
    expect(formatNumber(1000)).toBe(idr(1000));
    expect(formatNumber(1000.4)).toBe(idr(1000));
    expect(formatNumber(1000.5)).toBe(idr(1001));
  });

  it('treats null/undefined/non-numeric as 0', () => {
    expect(formatNumber(null)).toBe(idr(0));
    expect(formatNumber(undefined)).toBe(idr(0));
    // @ts-expect-error runtime-only check
    expect(formatNumber('abc')).toBe(idr(0));
  });
});
