import { describe, it, expect } from 'vitest';
import {
  buildAllProductsMarker,
  isAllProductsDiscount,
  parseAllProductsMarker,
} from './all-products-marker';

describe('isAllProductsDiscount', () => {
  it('returns false for null/undefined/empty', () => {
    expect(isAllProductsDiscount(null)).toBe(false);
    expect(isAllProductsDiscount(undefined)).toBe(false);
    expect(isAllProductsDiscount('')).toBe(false);
  });

  it('returns true when description contains the marker', () => {
    expect(isAllProductsDiscount('[ALL_PRODUCTS]|percent=10')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isAllProductsDiscount('[all_products]|percent=10')).toBe(true);
    expect(isAllProductsDiscount('[All_Products]')).toBe(true);
  });

  it('returns false for unrelated descriptions', () => {
    expect(isAllProductsDiscount('regular promo 10% off')).toBe(false);
    expect(isAllProductsDiscount('ALL_PRODUCTS')).toBe(false); // no brackets
  });
});

describe('parseAllProductsMarker', () => {
  it('returns nulls for null/undefined/empty input', () => {
    expect(parseAllProductsMarker(null)).toEqual({ percent: null, maxDiscount: null });
    expect(parseAllProductsMarker(undefined)).toEqual({ percent: null, maxDiscount: null });
    expect(parseAllProductsMarker('')).toEqual({ percent: null, maxDiscount: null });
  });

  it('parses percent and max fields', () => {
    expect(parseAllProductsMarker('[ALL_PRODUCTS]|percent=15|max=50000')).toEqual({
      percent: 15,
      maxDiscount: 50000,
    });
  });

  it('clamps percent to 0-100 range', () => {
    expect(parseAllProductsMarker('[ALL_PRODUCTS]|percent=150').percent).toBe(100);
    expect(parseAllProductsMarker('[ALL_PRODUCTS]|percent=0').percent).toBe(0);
  });

  it('returns null maxDiscount when max is zero or negative', () => {
    expect(parseAllProductsMarker('[ALL_PRODUCTS]|percent=10|max=0').maxDiscount).toBeNull();
  });

  it('returns null percent when percent field missing', () => {
    expect(parseAllProductsMarker('[ALL_PRODUCTS]|max=10000').percent).toBeNull();
  });

  it('is case-insensitive on field names', () => {
    expect(parseAllProductsMarker('[ALL_PRODUCTS]|PERCENT=20|MAX=5000')).toEqual({
      percent: 20,
      maxDiscount: 5000,
    });
  });

  it('parses only the first numeric match for each field', () => {
    // Regex matches first occurrence
    expect(parseAllProductsMarker('percent=10|percent=99').percent).toBe(10);
  });
});

describe('buildAllProductsMarker', () => {
  it('builds marker with percent only when maxDiscount is null', () => {
    expect(buildAllProductsMarker(10, null)).toBe('[ALL_PRODUCTS]|percent=10');
  });

  it('builds marker with percent and max when both provided', () => {
    expect(buildAllProductsMarker(15, 50000)).toBe(
      '[ALL_PRODUCTS]|percent=15|max=50000',
    );
  });

  it('rounds fractional percent', () => {
    expect(buildAllProductsMarker(12.7, null)).toBe('[ALL_PRODUCTS]|percent=13');
  });

  it('rounds fractional maxDiscount', () => {
    expect(buildAllProductsMarker(10, 1234.56)).toBe(
      '[ALL_PRODUCTS]|percent=10|max=1235',
    );
  });

  it('omits max when maxDiscount is zero', () => {
    expect(buildAllProductsMarker(10, 0)).toBe('[ALL_PRODUCTS]|percent=10');
  });

  it('omits max when maxDiscount is negative', () => {
    expect(buildAllProductsMarker(10, -5)).toBe('[ALL_PRODUCTS]|percent=10');
  });

  it('roundtrips through parseAllProductsMarker', () => {
    const built = buildAllProductsMarker(25, 100000);
    expect(parseAllProductsMarker(built)).toEqual({
      percent: 25,
      maxDiscount: 100000,
    });
  });
});
