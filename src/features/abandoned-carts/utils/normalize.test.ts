import { describe, it, expect } from 'vitest';
import { normalizeAbandonedCart } from './normalize';

describe('normalizeAbandonedCart', () => {
  it('returns defaults for empty input', () => {
    const result = normalizeAbandonedCart({});
    expect(result).toEqual({
      id: 0,
      userId: null,
      name: '',
      email: '',
      phoneNumber: null,
      items: [],
      abandonedValue: 0,
      totalOrders: 0,
      ltv: 0,
      recoveryRate: 0,
      lastActivity: null,
      createdAt: null,
      updatedAt: null,
    });
  });

  it('handles null/undefined raw input', () => {
    expect(normalizeAbandonedCart(null).id).toBe(0);
    expect(normalizeAbandonedCart(undefined).id).toBe(0);
  });

  it('reads camelCase fields', () => {
    const result = normalizeAbandonedCart({
      id: 42,
      userId: 7,
      name: 'Abby',
      email: 'a@b.com',
      phoneNumber: '0812',
      abandonedValue: 150000,
      totalOrders: 3,
      ltv: 750000,
      recoveryRate: 0.25,
      lastActivity: '2026-04-01',
      createdAt: '2026-01-01',
      updatedAt: '2026-02-01',
    });
    expect(result.id).toBe(42);
    expect(result.userId).toBe(7);
    expect(result.abandonedValue).toBe(150000);
    expect(result.totalOrders).toBe(3);
    expect(result.ltv).toBe(750000);
    expect(result.recoveryRate).toBe(0.25);
    expect(result.lastActivity).toBe('2026-04-01');
  });

  it('reads snake_case fallback', () => {
    const result = normalizeAbandonedCart({
      user_id: 9,
      phone_number: '0821',
      abandoned_value: 100,
      total_orders: 2,
      recovery_rate: 0.5,
      last_activity: '2026-04-10',
      created_at: '2026-01-02',
      updated_at: '2026-02-02',
    });
    expect(result.userId).toBe(9);
    expect(result.phoneNumber).toBe('0821');
    expect(result.abandonedValue).toBe(100);
    expect(result.totalOrders).toBe(2);
    expect(result.recoveryRate).toBe(0.5);
    expect(result.lastActivity).toBe('2026-04-10');
    expect(result.createdAt).toBe('2026-01-02');
    expect(result.updatedAt).toBe('2026-02-02');
  });

  it('userId preserves null when field absent', () => {
    expect(normalizeAbandonedCart({}).userId).toBeNull();
  });

  it('userId coerces numeric strings', () => {
    expect(normalizeAbandonedCart({ userId: '15' }).userId).toBe(15);
    expect(normalizeAbandonedCart({ user_id: '20' }).userId).toBe(20);
  });

  it('coerces numeric strings on money fields', () => {
    const result = normalizeAbandonedCart({
      abandonedValue: '99000',
      ltv: '1250000',
      totalOrders: '4',
    });
    expect(result.abandonedValue).toBe(99000);
    expect(result.ltv).toBe(1250000);
    expect(result.totalOrders).toBe(4);
  });

  it('falls back to 0 when numeric fields are non-numeric', () => {
    const result = normalizeAbandonedCart({
      abandonedValue: 'not-a-number',
      ltv: null,
      recoveryRate: undefined,
    });
    expect(result.abandonedValue).toBe(0);
    expect(result.ltv).toBe(0);
    expect(result.recoveryRate).toBe(0);
  });

  it('reads items from `carts` key', () => {
    const result = normalizeAbandonedCart({
      carts: [
        { id: 1, qty: 2, product: { name: 'Tee', price: 99000 } },
        { id: 2, qty: 1, product: { name: 'Cap', price: 50000 } },
      ],
    });
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toEqual({
      id: 1,
      productName: 'Tee',
      qty: 2,
      attributes: null,
      price: 99000,
      imageUrl: null,
    });
  });

  it('reads items from `items` key as fallback', () => {
    const result = normalizeAbandonedCart({
      items: [{ id: 5, qty: 3, product: { name: 'X', price: 10000 } }],
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe(5);
  });

  it('returns empty items for non-array input', () => {
    expect(normalizeAbandonedCart({ carts: 'nope' }).items).toEqual([]);
    expect(normalizeAbandonedCart({ carts: null }).items).toEqual([]);
  });

  it('extracts first media url as item imageUrl', () => {
    const result = normalizeAbandonedCart({
      carts: [
        {
          id: 1,
          qty: 1,
          product: {
            name: 'Tee',
            price: 100,
            medias: [
              { url: 'http://cdn/1.jpg' },
              { url: 'http://cdn/2.jpg' },
            ],
          },
        },
      ],
    });
    expect(result.items[0].imageUrl).toBe('http://cdn/1.jpg');
  });

  it('uses null imageUrl when medias empty or missing', () => {
    const r1 = normalizeAbandonedCart({
      carts: [{ id: 1, qty: 1, product: { name: 'X', price: 1, medias: [] } }],
    });
    const r2 = normalizeAbandonedCart({
      carts: [{ id: 2, qty: 1, product: { name: 'Y', price: 1 } }],
    });
    expect(r1.items[0].imageUrl).toBeNull();
    expect(r2.items[0].imageUrl).toBeNull();
  });

  it('defaults item productName to "(unnamed)" when product has no name', () => {
    const result = normalizeAbandonedCart({
      carts: [{ id: 1, qty: 1, product: {} }],
    });
    expect(result.items[0].productName).toBe('(unnamed)');
  });

  it('handles item without product object at all', () => {
    const result = normalizeAbandonedCart({
      carts: [{ id: 1, qty: 2, attributes: 'Size: M' }],
    });
    expect(result.items[0]).toEqual({
      id: 1,
      productName: '(unnamed)',
      qty: 2,
      attributes: 'Size: M',
      price: 0,
      imageUrl: null,
    });
  });

  it('coerces item qty and price to numbers', () => {
    const result = normalizeAbandonedCart({
      carts: [{ id: '10', qty: '5', product: { name: 'A', price: '2500' } }],
    });
    expect(result.items[0].id).toBe(10);
    expect(result.items[0].qty).toBe(5);
    expect(result.items[0].price).toBe(2500);
  });
});
