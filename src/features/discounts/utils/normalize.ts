import {
  DiscountActiveFlag,
  DiscountAppliesTo,
  DiscountDayOfWeek,
  DiscountItemValueType,
} from '../types';
import type {
  Discount,
  DiscountBrandOption,
  DiscountListItem,
  DiscountProductOption,
  DiscountVariantItem,
  DiscountVariantOption,
  DiscountVariantRef,
} from '../types';
import { deriveDiscountStatus } from './derive-status';

type UnknownRecord = Record<string, unknown>;

function pick<T>(source: UnknownRecord, ...keys: string[]): T | undefined {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null) return value as T;
  }
  return undefined;
}

function toNum(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toNumOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toActiveFlag(value: unknown): DiscountActiveFlag {
  if (typeof value === 'boolean') {
    return value ? DiscountActiveFlag.Active : DiscountActiveFlag.Inactive;
  }
  return Number(value) === 1
    ? DiscountActiveFlag.Active
    : DiscountActiveFlag.Inactive;
}

function toItemValueType(value: unknown): DiscountItemValueType {
  if (typeof value === 'number') {
    return value === 2
      ? DiscountItemValueType.Fixed
      : DiscountItemValueType.Percent;
  }
  const normalized = String(value ?? '').toLowerCase().trim();
  return normalized === 'fixed' || normalized === 'nominal'
    ? DiscountItemValueType.Fixed
    : DiscountItemValueType.Percent;
}

function normalizeVariantRef(raw: unknown): DiscountVariantRef | null {
  if (!raw || typeof raw !== 'object') return null;
  const v = raw as UnknownRecord;
  const id = toNum(pick(v, 'id'), 0);
  if (id <= 0) return null;
  const product = pick<UnknownRecord>(v, 'product') ?? null;
  return {
    id,
    productId: toNumOrNull(pick(v, 'productId', 'product_id')),
    sku: (pick<string>(v, 'sku') ?? null) as string | null,
    price: toNumOrNull(pick(v, 'price')),
    stock: toNumOrNull(pick(v, 'stock')),
    label: (pick<string>(v, 'label') ?? null) as string | null,
    product: product
      ? {
          id: toNum(pick(product, 'id'), 0),
          name: String(pick(product, 'name') ?? ''),
        }
      : null,
  };
}

export function normalizeDiscountVariantItem(
  raw: unknown,
): DiscountVariantItem {
  const source = (raw ?? {}) as UnknownRecord;
  return {
    id: toNumOrNull(pick(source, 'id')) ?? undefined,
    discountId: toNumOrNull(pick(source, 'discountId', 'discount_id')) ?? undefined,
    productVariantId: toNum(
      pick(source, 'productVariantId', 'product_variant_id'),
      0,
    ),
    productId: toNumOrNull(pick(source, 'productId', 'product_id')),
    isActive: toActiveFlag(pick(source, 'isActive', 'is_active')) ===
      DiscountActiveFlag.Active,
    valueType: toItemValueType(pick(source, 'valueType', 'value_type')),
    value: toNumOrNull(pick(source, 'value')),
    maxDiscount: toNumOrNull(pick(source, 'maxDiscount', 'max_discount')),
    promoStock: toNumOrNull(pick(source, 'promoStock', 'promo_stock')),
    purchaseLimit: toNumOrNull(pick(source, 'purchaseLimit', 'purchase_limit')),
    variant: normalizeVariantRef(pick(source, 'variant')),
  };
}

function bitmaskToDaysOfWeek(mask: number): DiscountDayOfWeek[] {
  if (!Number.isFinite(mask) || mask <= 0) return [];
  const days: DiscountDayOfWeek[] = [];
  for (let i = 0; i < 7; i += 1) {
    if ((mask >> i) & 1) days.push(String(i) as DiscountDayOfWeek);
  }
  return days;
}

function resolveDaysOfWeek(source: UnknownRecord): DiscountDayOfWeek[] {
  const maskRaw = pick(source, 'daysOfWeekMask', 'days_of_week_mask');
  if (maskRaw !== undefined) {
    return bitmaskToDaysOfWeek(Number(maskRaw));
  }
  const arrRaw = pick<unknown[]>(source, 'daysOfWeek', 'days_of_week') ?? [];
  return Array.isArray(arrRaw)
    ? (arrRaw
        .map((v) => String(v))
        .filter((v) => /^[0-6]$/.test(v)) as DiscountDayOfWeek[])
    : [];
}

export function normalizeDiscount(raw: unknown): Discount {
  const source = (raw ?? {}) as UnknownRecord;
  const rawItems =
    (pick<unknown[]>(source, 'variantItems', 'variant_items') as unknown[]) ?? [];
  const variantItems = Array.isArray(rawItems)
    ? rawItems.map(normalizeDiscountVariantItem)
    : [];

  const daysOfWeek = resolveDaysOfWeek(source);

  const startedAt =
    (pick<string>(source, 'startedAt', 'started_at') ?? null) as string | null;
  const expiredAt =
    (pick<string>(source, 'expiredAt', 'expired_at') ?? null) as string | null;
  const noExpiryRaw = pick(source, 'noExpiry', 'no_expiry');
  const noExpiry =
    noExpiryRaw !== undefined
      ? toActiveFlag(noExpiryRaw)
      : !startedAt && !expiredAt
        ? DiscountActiveFlag.Active
        : DiscountActiveFlag.Inactive;

  return {
    id: toNum(pick(source, 'id'), 0),
    name: String(pick(source, 'name') ?? ''),
    code: String(pick(source, 'code') ?? ''),
    description: (pick<string>(source, 'description') ?? null) as string | null,
    valueType: toNum(pick(source, 'valueType', 'value_type'), 1),
    value: toNum(pick(source, 'value'), 0),
    maxDiscount: toNumOrNull(pick(source, 'maxDiscount', 'max_discount')),
    appliesTo: (toNum(pick(source, 'appliesTo', 'applies_to'), DiscountAppliesTo.Products) as DiscountAppliesTo),
    minOrderAmount: toNumOrNull(
      pick(source, 'minOrderAmount', 'min_order_amount'),
    ),
    isActive: toActiveFlag(pick(source, 'isActive', 'is_active')),
    isAuto: toActiveFlag(pick(source, 'isAuto', 'is_auto')),
    isEcommerce: toActiveFlag(pick(source, 'isEcommerce', 'is_ecommerce')),
    isPos: toActiveFlag(pick(source, 'isPos', 'is_pos')),
    startedAt,
    expiredAt,
    noExpiry,
    daysOfWeek,
    variantItems,
    qty: toNumOrNull(pick(source, 'qty')),
    createdAt: (pick<string>(source, 'createdAt', 'created_at') ?? null) as
      | string
      | null,
    updatedAt: (pick<string>(source, 'updatedAt', 'updated_at') ?? null) as
      | string
      | null,
  };
}

export function normalizeDiscountBrandOption(raw: unknown): DiscountBrandOption {
  const source = (raw ?? {}) as UnknownRecord;
  return {
    id: toNum(pick(source, 'id'), 0),
    name: String(pick(source, 'name') ?? ''),
    slug: (pick<string>(source, 'slug') ?? null) as string | null,
    logo: (pick<string>(source, 'logo', 'image') ?? null) as string | null,
  };
}

export function normalizeDiscountVariantOption(
  raw: unknown,
): DiscountVariantOption {
  const source = (raw ?? {}) as UnknownRecord;
  const id = toNum(pick(source, 'id', 'productVariantId', 'product_variant_id'), 0);
  const productId = toNumOrNull(pick(source, 'productId', 'product_id'));
  return {
    id,
    productId,
    sku: (pick<string>(source, 'sku') ?? null) as string | null,
    price: toNumOrNull(pick(source, 'price')),
    stock: toNumOrNull(pick(source, 'stock')),
    label: (pick<string>(source, 'label') ?? null) as string | null,
    product: null,
    productName: (pick<string>(source, 'productName', 'product_name') ?? null) as
      | string
      | null,
    brandId: toNumOrNull(pick(source, 'brandId', 'brand_id')),
    brandName: (pick<string>(source, 'brandName', 'brand_name') ?? null) as
      | string
      | null,
  };
}

export function normalizeDiscountProductOption(
  raw: unknown,
): DiscountProductOption {
  const source = (raw ?? {}) as UnknownRecord;
  const brandId = toNumOrNull(pick(source, 'brandId', 'brand_id'));
  const brandName = pick<string>(source, 'brandName', 'brand_name') ?? null;
  const brandRaw = pick<UnknownRecord>(source, 'brand');
  const brand = brandRaw
    ? { id: toNum(pick(brandRaw, 'id'), 0), name: String(pick(brandRaw, 'name') ?? '') }
    : brandId != null
      ? { id: brandId, name: brandName ?? '' }
      : null;

  const variantsRaw = pick<unknown[]>(source, 'variants');
  const variants = Array.isArray(variantsRaw)
    ? variantsRaw.map((v) => {
        const opt = normalizeDiscountVariantOption(v);
        return {
          id: opt.id,
          productId: opt.productId,
          sku: opt.sku,
          price: opt.price,
          stock: opt.stock,
          label: opt.label,
          product: null,
        } satisfies DiscountVariantRef;
      })
    : undefined;

  return {
    id: toNum(pick(source, 'id'), 0),
    name: String(pick(source, 'name') ?? ''),
    slug: (pick<string>(source, 'slug') ?? null) as string | null,
    masterSku: (pick<string>(source, 'masterSku', 'master_sku') ?? null) as
      | string
      | null,
    brand,
    variants,
  };
}

export function toDiscountListItem(discount: Discount): DiscountListItem {
  return {
    ...discount,
    status: deriveDiscountStatus(discount),
  };
}
