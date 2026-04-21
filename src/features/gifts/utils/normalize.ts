import type { GiftProduct } from '../types';

type UnknownRecord = Record<string, unknown>;

function pick<T>(source: UnknownRecord, ...keys: string[]): T | undefined {
  for (const key of keys) {
    const v = source[key];
    if (v !== undefined && v !== null) return v as T;
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

export function normalizeGiftProduct(raw: unknown): GiftProduct {
  const src = (raw ?? {}) as UnknownRecord;
  return {
    id: toNum(pick(src, 'id')),
    brandId: toNumOrNull(pick(src, 'brandId', 'brand_id')),
    brandName: (pick<string>(src, 'brandName', 'brand_name') ?? null) as string | null,
    productName: String(pick(src, 'productName', 'product_name', 'name') ?? ''),
    variantName: (pick<string>(src, 'variantName', 'variant_name') ?? null) as string | null,
    productVariantSku: (pick<string>(src, 'productVariantSku', 'product_variant_sku') ?? null) as string | null,
    productVariantId: toNumOrNull(pick(src, 'productVariantId', 'product_variant_id')),
    isSellable: Boolean(pick(src, 'isSellable', 'is_sellable') ?? false),
    price: toNum(pick(src, 'price')),
    stock: toNum(pick(src, 'stock')),
    weight: toNum(pick(src, 'weight')),
    imageUrl: (pick<string>(src, 'imageUrl', 'image_url') ?? null) as string | null,
    isActive: Boolean(pick(src, 'isActive', 'is_active') ?? true),
    createdAt: (pick<string>(src, 'createdAt', 'created_at') ?? null) as string | null,
    updatedAt: (pick<string>(src, 'updatedAt', 'updated_at') ?? null) as string | null,
  };
}
