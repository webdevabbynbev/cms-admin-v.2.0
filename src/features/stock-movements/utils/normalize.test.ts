import { describe, it, expect } from 'vitest';
import { normalizeStockMovement } from './normalize';

describe('normalizeStockMovement', () => {
  it('returns defaults for empty input', () => {
    expect(normalizeStockMovement({})).toEqual({
      id: 0,
      change: 0,
      type: '',
      note: null,
      variant: null,
      createdAt: null,
    });
  });

  it('handles null/undefined raw input', () => {
    expect(normalizeStockMovement(null).id).toBe(0);
    expect(normalizeStockMovement(undefined).id).toBe(0);
  });

  it('reads top-level fields with snake_case fallback', () => {
    const result = normalizeStockMovement({
      id: 5,
      change: -3,
      type: 'adjustment',
      note: 'damaged',
      created_at: '2026-04-01T10:00:00+07:00',
    });
    expect(result).toEqual({
      id: 5,
      change: -3,
      type: 'adjustment',
      note: 'damaged',
      variant: null,
      createdAt: '2026-04-01T10:00:00+07:00',
    });
  });

  it('coerces numeric strings for id + change', () => {
    const result = normalizeStockMovement({ id: '10', change: '-5' });
    expect(result.id).toBe(10);
    expect(result.change).toBe(-5);
  });

  it('normalizes nested variant with product', () => {
    const result = normalizeStockMovement({
      id: 1,
      variant: {
        id: 99,
        sku: 'SKU-1',
        barcode: '123',
        product: { name: 'Test Product' },
      },
    });
    expect(result.variant).toEqual({
      id: 99,
      sku: 'SKU-1',
      barcode: '123',
      productName: 'Test Product',
    });
  });

  it('variant productName is null when product missing', () => {
    const result = normalizeStockMovement({
      id: 1,
      variant: { id: 1, sku: 'SKU' },
    });
    expect(result.variant?.productName).toBeNull();
  });

  it('variant productName empty string when product has no name', () => {
    const result = normalizeStockMovement({
      id: 1,
      variant: { id: 1, product: {} },
    });
    expect(result.variant?.productName).toBe('');
  });

  it('variant id null for empty string and non-numeric', () => {
    expect(
      normalizeStockMovement({ variant: { id: '', sku: 'X' } }).variant?.id,
    ).toBeNull();
    expect(
      normalizeStockMovement({ variant: { id: 'abc', sku: 'X' } }).variant?.id,
    ).toBeNull();
  });

  it('variant id coerces numeric string', () => {
    expect(
      normalizeStockMovement({ variant: { id: '42' } }).variant?.id,
    ).toBe(42);
  });

  it('variant sku/barcode null when not provided', () => {
    const result = normalizeStockMovement({
      variant: { id: 1 },
    });
    expect(result.variant).toEqual({
      id: 1,
      sku: null,
      barcode: null,
      productName: null,
    });
  });

  it('variant stays null when variant key missing entirely', () => {
    expect(normalizeStockMovement({ id: 1 }).variant).toBeNull();
  });
});
