import { describe, it, expect } from 'vitest';
import {
  normalizeDiscount,
  normalizeDiscountBrandOption,
  normalizeDiscountProductOption,
  normalizeDiscountVariantItem,
  normalizeDiscountVariantOption,
} from './normalize';
import {
  DiscountActiveFlag,
  DiscountAppliesTo,
  DiscountDayOfWeek,
  DiscountItemValueType,
} from '../types';

describe('normalizeDiscount', () => {
  it('returns defaults for empty input', () => {
    const result = normalizeDiscount({});
    expect(result).toMatchObject({
      id: 0,
      name: '',
      code: '',
      description: null,
      valueType: 1,
      value: 0,
      appliesTo: DiscountAppliesTo.Products,
      isActive: DiscountActiveFlag.Inactive,
      daysOfWeek: [],
      variantItems: [],
    });
  });

  it('reads camelCase + snake_case', () => {
    const result = normalizeDiscount({
      id: 1,
      name: 'Big Sale',
      code: 'BIG',
      value_type: 2,
      min_order_amount: 100000,
      is_active: 1,
      is_ecommerce: 1,
      started_at: '2026-04-01',
      expired_at: '2026-04-30',
    });
    expect(result).toMatchObject({
      id: 1,
      name: 'Big Sale',
      code: 'BIG',
      valueType: 2,
      minOrderAmount: 100000,
      isActive: DiscountActiveFlag.Active,
      isEcommerce: DiscountActiveFlag.Active,
      startedAt: '2026-04-01',
      expiredAt: '2026-04-30',
    });
  });

  it('maps boolean is_active to DiscountActiveFlag', () => {
    expect(normalizeDiscount({ isActive: true }).isActive).toBe(
      DiscountActiveFlag.Active,
    );
    expect(normalizeDiscount({ isActive: false }).isActive).toBe(
      DiscountActiveFlag.Inactive,
    );
  });

  it('parses daysOfWeek from explicit array', () => {
    expect(
      normalizeDiscount({ daysOfWeek: ['0', '3', '6'] }).daysOfWeek,
    ).toEqual([
      DiscountDayOfWeek.Sunday,
      DiscountDayOfWeek.Wednesday,
      DiscountDayOfWeek.Saturday,
    ]);
  });

  it('filters invalid daysOfWeek values', () => {
    expect(
      normalizeDiscount({ days_of_week: ['0', '9', 'bogus', 3] }).daysOfWeek,
    ).toEqual([DiscountDayOfWeek.Sunday, DiscountDayOfWeek.Wednesday]);
  });

  it('parses daysOfWeek from bitmask', () => {
    // 0b0000101 = Sunday (bit 0) + Tuesday (bit 2)
    expect(normalizeDiscount({ daysOfWeekMask: 5 }).daysOfWeek).toEqual([
      DiscountDayOfWeek.Sunday,
      DiscountDayOfWeek.Tuesday,
    ]);
    // All 7 days: 0b1111111 = 127
    expect(normalizeDiscount({ days_of_week_mask: 127 }).daysOfWeek).toHaveLength(7);
  });

  it('prefers bitmask over array when both present', () => {
    expect(
      normalizeDiscount({ daysOfWeekMask: 1, daysOfWeek: ['3', '4'] }).daysOfWeek,
    ).toEqual([DiscountDayOfWeek.Sunday]);
  });

  it('returns empty daysOfWeek for mask=0 or invalid', () => {
    expect(normalizeDiscount({ daysOfWeekMask: 0 }).daysOfWeek).toEqual([]);
    expect(normalizeDiscount({ daysOfWeekMask: -1 }).daysOfWeek).toEqual([]);
    expect(normalizeDiscount({ daysOfWeekMask: 'bogus' }).daysOfWeek).toEqual([]);
  });

  it('derives noExpiry=Active when both startedAt and expiredAt missing', () => {
    expect(normalizeDiscount({}).noExpiry).toBe(DiscountActiveFlag.Active);
  });

  it('derives noExpiry=Inactive when dates present', () => {
    expect(
      normalizeDiscount({ started_at: '2026-01-01', expired_at: '2026-12-31' })
        .noExpiry,
    ).toBe(DiscountActiveFlag.Inactive);
  });

  it('honors explicit noExpiry when provided', () => {
    expect(
      normalizeDiscount({ started_at: '2026-01-01', expired_at: null, noExpiry: true })
        .noExpiry,
    ).toBe(DiscountActiveFlag.Active);
    expect(normalizeDiscount({ no_expiry: 1 }).noExpiry).toBe(DiscountActiveFlag.Active);
  });

  it('normalizes variantItems array', () => {
    const result = normalizeDiscount({
      variantItems: [
        { id: 1, productVariantId: 100, value: 15, valueType: 'percent' },
        { id: 2, productVariantId: 101, value: 5000, value_type: 'fixed' },
      ],
    });
    expect(result.variantItems).toHaveLength(2);
    expect(result.variantItems[0]).toMatchObject({
      productVariantId: 100,
      value: 15,
      valueType: DiscountItemValueType.Percent,
    });
    expect(result.variantItems[1].valueType).toBe(DiscountItemValueType.Fixed);
  });

  it('reads snake_case variant_items key', () => {
    const result = normalizeDiscount({
      variant_items: [{ product_variant_id: 99, value: 10 }],
    });
    expect(result.variantItems[0].productVariantId).toBe(99);
  });
});

describe('normalizeDiscountVariantItem', () => {
  it('maps value_type: 2 → Fixed, other numeric → Percent', () => {
    expect(normalizeDiscountVariantItem({ value_type: 2 }).valueType).toBe(
      DiscountItemValueType.Fixed,
    );
    expect(normalizeDiscountVariantItem({ value_type: 1 }).valueType).toBe(
      DiscountItemValueType.Percent,
    );
  });

  it('maps value_type string: "fixed"/"nominal" → Fixed, else Percent', () => {
    expect(normalizeDiscountVariantItem({ value_type: 'fixed' }).valueType).toBe(
      DiscountItemValueType.Fixed,
    );
    expect(normalizeDiscountVariantItem({ value_type: 'nominal' }).valueType).toBe(
      DiscountItemValueType.Fixed,
    );
    expect(normalizeDiscountVariantItem({ value_type: 'percent' }).valueType).toBe(
      DiscountItemValueType.Percent,
    );
    expect(normalizeDiscountVariantItem({}).valueType).toBe(
      DiscountItemValueType.Percent,
    );
  });

  it('normalizes nested variant ref', () => {
    const result = normalizeDiscountVariantItem({
      productVariantId: 10,
      variant: {
        id: 10,
        product_id: 200,
        sku: 'SKU-A',
        price: 99000,
        product: { id: 200, name: 'Lipstick' },
      },
    });
    expect(result.variant).toMatchObject({
      id: 10,
      productId: 200,
      sku: 'SKU-A',
      price: 99000,
      product: { id: 200, name: 'Lipstick' },
    });
  });

  it('returns null variant ref when id missing or zero', () => {
    expect(normalizeDiscountVariantItem({ variant: { id: 0 } }).variant).toBeNull();
    expect(normalizeDiscountVariantItem({ variant: null }).variant).toBeNull();
    expect(normalizeDiscountVariantItem({}).variant).toBeNull();
  });

  it('coerces isActive via DiscountActiveFlag', () => {
    expect(normalizeDiscountVariantItem({ is_active: 1 }).isActive).toBe(true);
    expect(normalizeDiscountVariantItem({ is_active: 0 }).isActive).toBe(false);
    expect(normalizeDiscountVariantItem({ isActive: true }).isActive).toBe(true);
  });
});

describe('normalizeDiscountBrandOption', () => {
  it('defaults for empty input', () => {
    expect(normalizeDiscountBrandOption({})).toEqual({
      id: 0,
      name: '',
      slug: null,
      logo: null,
    });
  });

  it('reads logo from "image" fallback', () => {
    expect(normalizeDiscountBrandOption({ image: 'http://x/y.png' }).logo).toBe(
      'http://x/y.png',
    );
  });
});

describe('normalizeDiscountVariantOption', () => {
  it('reads id from productVariantId fallback', () => {
    expect(
      normalizeDiscountVariantOption({ product_variant_id: 42 }).id,
    ).toBe(42);
  });

  it('extracts brandId/brandName at the variant level', () => {
    const result = normalizeDiscountVariantOption({
      id: 1,
      brand_id: 10,
      brand_name: 'Abby',
      product_name: 'Mascara',
    });
    expect(result).toMatchObject({
      brandId: 10,
      brandName: 'Abby',
      productName: 'Mascara',
    });
  });
});

describe('normalizeDiscountProductOption', () => {
  it('builds brand from explicit brand object', () => {
    const result = normalizeDiscountProductOption({
      id: 1,
      name: 'Lipstick',
      brand: { id: 5, name: 'Abby' },
    });
    expect(result.brand).toEqual({ id: 5, name: 'Abby' });
  });

  it('builds brand from brandId+brandName fallback', () => {
    const result = normalizeDiscountProductOption({
      id: 1,
      brand_id: 7,
      brand_name: 'Bev',
    });
    expect(result.brand).toEqual({ id: 7, name: 'Bev' });
  });

  it('returns brand null when no brand info', () => {
    expect(normalizeDiscountProductOption({ id: 1 }).brand).toBeNull();
  });

  it('normalizes variants sub-array', () => {
    const result = normalizeDiscountProductOption({
      id: 1,
      variants: [
        { id: 10, product_id: 1, sku: 'A' },
        { id: 11, product_id: 1, sku: 'B' },
      ],
    });
    expect(result.variants).toHaveLength(2);
    expect(result.variants?.[0]).toMatchObject({ id: 10, sku: 'A' });
  });

  it('preserves masterSku from snake_case', () => {
    expect(
      normalizeDiscountProductOption({ master_sku: 'LIP-001' }).masterSku,
    ).toBe('LIP-001');
  });
});
