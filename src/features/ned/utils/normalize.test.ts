import { describe, it, expect } from 'vitest';
import { normalizeNed } from './normalize';

describe('normalizeNed', () => {
  it('returns defaults for empty input', () => {
    expect(normalizeNed({})).toEqual({
      id: 0,
      name: '',
      description: null,
      sku: null,
      price: null,
      quantity: null,
      isActive: true,
      isVisibleEcommerce: true,
      isVisiblePos: false,
      createdAt: null,
      updatedAt: null,
    });
  });

  it('handles null/undefined raw input', () => {
    expect(normalizeNed(null).id).toBe(0);
    expect(normalizeNed(undefined).id).toBe(0);
  });

  it('reads camelCase fields', () => {
    const result = normalizeNed({
      id: 7,
      name: 'Non-ED item',
      description: 'A description',
      sku: 'NED-1',
      price: 75000,
      quantity: 10,
      isActive: false,
      isVisibleEcommerce: false,
      isVisiblePos: true,
    });
    expect(result).toEqual({
      id: 7,
      name: 'Non-ED item',
      description: 'A description',
      sku: 'NED-1',
      price: 75000,
      quantity: 10,
      isActive: false,
      isVisibleEcommerce: false,
      isVisiblePos: true,
      createdAt: null,
      updatedAt: null,
    });
  });

  it('reads snake_case fallbacks', () => {
    const result = normalizeNed({
      is_active: false,
      is_visible_ecommerce: false,
      is_visible_pos: true,
      created_at: '2026-01-01',
      updated_at: '2026-01-02',
    });
    expect(result.isActive).toBe(false);
    expect(result.isVisibleEcommerce).toBe(false);
    expect(result.isVisiblePos).toBe(true);
    expect(result.createdAt).toBe('2026-01-01');
    expect(result.updatedAt).toBe('2026-01-02');
  });

  it('default toggles: isActive=true, isVisibleEcommerce=true, isVisiblePos=false', () => {
    const result = normalizeNed({});
    expect(result.isActive).toBe(true);
    expect(result.isVisibleEcommerce).toBe(true);
    expect(result.isVisiblePos).toBe(false);
  });

  it('price/quantity: null for empty string', () => {
    const result = normalizeNed({ price: '', quantity: '' });
    expect(result.price).toBeNull();
    expect(result.quantity).toBeNull();
  });

  it('price/quantity: coerce numeric strings', () => {
    const result = normalizeNed({ price: '99000', quantity: '5' });
    expect(result.price).toBe(99000);
    expect(result.quantity).toBe(5);
  });

  it('price/quantity: null for non-numeric', () => {
    const result = normalizeNed({ price: 'abc', quantity: 'xyz' });
    expect(result.price).toBeNull();
    expect(result.quantity).toBeNull();
  });

  it('price/quantity: null when absent (not 0)', () => {
    const result = normalizeNed({});
    expect(result.price).toBeNull();
    expect(result.quantity).toBeNull();
  });

  it('sku stays null when not provided', () => {
    expect(normalizeNed({ id: 1 }).sku).toBeNull();
  });
});
