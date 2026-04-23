import { describe, it, expect } from 'vitest';
import { normalizeB1g1 } from './normalize';

describe('normalizeB1g1', () => {
  it('returns defaults for empty input', () => {
    expect(normalizeB1g1({})).toEqual({
      id: 0,
      name: '',
      code: '',
      description: null,
      isActive: true,
      isEcommerce: true,
      isPos: false,
      applyTo: 'all',
      brandId: null,
      usageLimit: null,
      minimumPurchase: null,
      startedAt: null,
      expiredAt: null,
      createdAt: null,
      updatedAt: null,
    });
  });

  it('handles null/undefined raw input', () => {
    expect(normalizeB1g1(null).id).toBe(0);
    expect(normalizeB1g1(undefined).id).toBe(0);
  });

  it('reads camelCase fields', () => {
    const result = normalizeB1g1({
      id: 5,
      name: 'Promo',
      code: 'B1G1',
      description: 'Buy one get one',
      isActive: false,
      isEcommerce: false,
      isPos: true,
      applyTo: 'brand',
      brandId: 3,
      usageLimit: 100,
      minimumPurchase: 50000,
      startedAt: '2026-04-01T00:00:00+07:00',
      expiredAt: '2026-04-30T23:59:59+07:00',
    });
    expect(result).toEqual({
      id: 5,
      name: 'Promo',
      code: 'B1G1',
      description: 'Buy one get one',
      isActive: false,
      isEcommerce: false,
      isPos: true,
      applyTo: 'brand',
      brandId: 3,
      usageLimit: 100,
      minimumPurchase: 50000,
      startedAt: '2026-04-01T00:00:00+07:00',
      expiredAt: '2026-04-30T23:59:59+07:00',
      createdAt: null,
      updatedAt: null,
    });
  });

  it('reads snake_case fallbacks', () => {
    const result = normalizeB1g1({
      is_active: false,
      is_ecommerce: false,
      is_pos: true,
      apply_to: 'category',
      brand_id: 7,
      usage_limit: 50,
      minimum_purchase: 25000,
      started_at: '2026-05-01',
      expired_at: '2026-05-31',
      created_at: '2026-01-01',
      updated_at: '2026-01-02',
    });
    expect(result.isActive).toBe(false);
    expect(result.isEcommerce).toBe(false);
    expect(result.isPos).toBe(true);
    expect(result.applyTo).toBe('category');
    expect(result.brandId).toBe(7);
    expect(result.usageLimit).toBe(50);
    expect(result.minimumPurchase).toBe(25000);
    expect(result.startedAt).toBe('2026-05-01');
    expect(result.expiredAt).toBe('2026-05-31');
    expect(result.createdAt).toBe('2026-01-01');
    expect(result.updatedAt).toBe('2026-01-02');
  });

  it('default toggles: isActive=true, isEcommerce=true, isPos=false', () => {
    const result = normalizeB1g1({});
    expect(result.isActive).toBe(true);
    expect(result.isEcommerce).toBe(true);
    expect(result.isPos).toBe(false);
  });

  it('applyTo defaults to "all"', () => {
    expect(normalizeB1g1({}).applyTo).toBe('all');
  });

  it('brandId/usageLimit/minimumPurchase: null for empty string', () => {
    const result = normalizeB1g1({
      brandId: '',
      usageLimit: '',
      minimumPurchase: '',
    });
    expect(result.brandId).toBeNull();
    expect(result.usageLimit).toBeNull();
    expect(result.minimumPurchase).toBeNull();
  });

  it('brandId/usageLimit/minimumPurchase: coerce numeric strings', () => {
    const result = normalizeB1g1({
      brandId: '5',
      usageLimit: '20',
      minimumPurchase: '100000',
    });
    expect(result.brandId).toBe(5);
    expect(result.usageLimit).toBe(20);
    expect(result.minimumPurchase).toBe(100000);
  });

  it('brandId null for non-numeric strings', () => {
    expect(normalizeB1g1({ brandId: 'xyz' }).brandId).toBeNull();
  });
});
