import { describe, it, expect } from 'vitest';
import { normalizeVoucher } from './normalize';
import {
  VoucherActiveStatus,
  VoucherScopeType,
  VoucherType,
  VoucherValueMode,
} from '../types';

describe('normalizeVoucher', () => {
  it('returns sensible defaults for empty input', () => {
    const result = normalizeVoucher({});
    expect(result).toMatchObject({
      id: 0,
      name: '',
      code: '',
      type: VoucherType.Product,
      rewardType: null,
      isPercentage: VoucherValueMode.Percentage,
      price: null,
      percentage: null,
      scopeType: VoucherScopeType.All,
      scopeIds: [],
      giftProductIds: [],
      giftProductName: null,
      qty: 0,
      usedCount: 0,
      isActive: VoucherActiveStatus.Active,
      isVisible: true,
      isStackable: true,
      isVoucherStackable: true,
    });
  });

  it('unwraps $attributes + $original Adonis wrappers', () => {
    const result = normalizeVoucher({
      $attributes: { id: 1, code: 'PROMO10' },
      $original: { name: 'Promo 10' },
    });
    expect(result.id).toBe(1);
    expect(result.code).toBe('PROMO10');
    expect(result.name).toBe('Promo 10');
  });

  it('reads camelCase + snake_case for started_at/expired_at', () => {
    expect(
      normalizeVoucher({ started_at: '2026-01-01', expired_at: '2026-12-31' }),
    ).toMatchObject({ startedAt: '2026-01-01', expiredAt: '2026-12-31' });
  });

  it('maps isActive: true → Active, false → Inactive, 2 → Inactive', () => {
    expect(normalizeVoucher({ isActive: true }).isActive).toBe(
      VoucherActiveStatus.Active,
    );
    expect(normalizeVoucher({ isActive: false }).isActive).toBe(
      VoucherActiveStatus.Inactive,
    );
    expect(normalizeVoucher({ is_active: 2 }).isActive).toBe(
      VoucherActiveStatus.Inactive,
    );
    expect(normalizeVoucher({ is_active: 1 }).isActive).toBe(
      VoucherActiveStatus.Active,
    );
  });

  it('parses scopeIds from array of numbers', () => {
    expect(normalizeVoucher({ scopeIds: [1, 2, 3] }).scopeIds).toEqual([1, 2, 3]);
  });

  it('parses scopeIds from array of objects with id field', () => {
    expect(
      normalizeVoucher({ scope_ids: [{ id: 10 }, { id: 20 }] }).scopeIds,
    ).toEqual([10, 20]);
  });

  it('parses scopeIds from comma-separated string', () => {
    expect(normalizeVoucher({ scope_ids: '5, 6, 7' }).scopeIds).toEqual([5, 6, 7]);
  });

  it('dedupes and filters invalid scopeIds', () => {
    expect(
      normalizeVoucher({ scopeIds: [1, 1, 2, 'nope', 0, -5, null] }).scopeIds,
    ).toEqual([1, 2]);
  });

  it('reads giftProductIds from id array', () => {
    expect(
      normalizeVoucher({ gift_product_ids: [100, 200] }).giftProductIds,
    ).toEqual([100, 200]);
  });

  it('extracts gift ids from giftProducts relation when explicit ids absent', () => {
    const result = normalizeVoucher({
      giftProducts: [
        { id: 100, name: 'Free Tote' },
        { id: 200, name: 'Sample Kit' },
      ],
    });
    expect(result.giftProductIds).toEqual([100, 200]);
    expect(result.giftProductName).toBe('Free Tote');
  });

  it('prefers explicit giftProductName over first relation item', () => {
    const result = normalizeVoucher({
      giftProductName: 'Explicit Name',
      giftProducts: [{ id: 100, name: 'Relation Name' }],
    });
    expect(result.giftProductName).toBe('Explicit Name');
  });

  it('coerces price/percentage/maxDiscPrice to number or null', () => {
    const result = normalizeVoucher({
      price: '10000',
      percentage: 15,
      max_disc_price: '50000',
      minimum_purchase: '20000',
    });
    expect(result.price).toBe(10000);
    expect(result.percentage).toBe(15);
    expect(result.maxDiscPrice).toBe(50000);
    expect(result.minPurchaseAmount).toBe(20000);
  });

  it('treats empty string as null for optional numbers', () => {
    const result = normalizeVoucher({ price: '', percentage: '', max_disc_price: '' });
    expect(result.price).toBeNull();
    expect(result.percentage).toBeNull();
    expect(result.maxDiscPrice).toBeNull();
  });

  it('reads minimum_purchase as alt key for minPurchaseAmount', () => {
    expect(normalizeVoucher({ minimum_purchase: 50000 }).minPurchaseAmount).toBe(
      50000,
    );
  });

  it('falls back to stackable/voucher_stackable keys', () => {
    expect(normalizeVoucher({ stackable: false }).isStackable).toBe(false);
    expect(
      normalizeVoucher({ voucher_stackable: false }).isVoucherStackable,
    ).toBe(false);
  });

  it('coerces type and scopeType via Number()', () => {
    const result = normalizeVoucher({ type: '2', scope_type: '3' });
    expect(result.type).toBe(VoucherType.Shipping);
    expect(result.scopeType).toBe(VoucherScopeType.Brand);
  });
});
