import { toWib, wibNow } from '@/utils/timezone';
import { FlashSaleStatus } from '../types';
import type { FlashSale, FlashSaleListItem, FlashSaleVariant } from '../types';

type UnknownRecord = Record<string, unknown>;

function unwrap(source: unknown): UnknownRecord {
  const raw = (source ?? {}) as UnknownRecord;
  const attrs = raw.$attributes as UnknownRecord | undefined;
  return { ...(attrs ?? {}), ...raw };
}

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
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeVariant(raw: unknown): FlashSaleVariant {
  const src = unwrap(raw);
  const product = unwrap(pick(src, 'product'));
  return {
    id: toNumOrNull(pick(src, 'id')) ?? undefined,
    variantId: toNum(pick(src, 'variantId', 'variant_id', 'productVariantId')),
    productId: toNum(pick(src, 'productId', 'product_id')) || toNum(pick(product, 'id')),
    productName:
      (pick<string>(src, 'productName', 'product_name') as string | undefined) ??
      (pick<string>(product, 'name') as string | undefined) ??
      '',
    sku: (pick<string>(src, 'sku') ?? null) as string | null,
    image: (pick<string>(src, 'image', 'photo', 'imageUrl') ?? null) as string | null,
    label: String(pick(src, 'label') ?? ''),
    basePrice: toNum(pick(src, 'basePrice', 'base_price', 'price')),
    baseStock: toNum(pick(src, 'baseStock', 'base_stock', 'stock')),
    flashPrice: toNum(pick(src, 'flashPrice', 'flash_price')),
    flashStock: toNum(pick(src, 'flashStock', 'flash_stock', 'promo_stock')),
    isActive: Boolean(pick(src, 'isActive', 'is_active') ?? true),
  };
}

function normalizeProductAsVariant(raw: unknown): FlashSaleVariant {
  const src = unwrap(raw);
  const pivot = (pick<UnknownRecord>(src, 'pivot') ?? {}) as UnknownRecord;
  const variantId = toNum(
    pick(pivot, 'product_variant_id', 'variant_id') ??
      pick(src, 'variantId', 'variant_id', 'productVariantId', 'id'),
  );
  const productId = toNum(pick(pivot, 'product_id') ?? pick(src, 'id'));
  const basePrice = toNum(pick(src, 'basePrice', 'base_price', 'price', 'realprice'));
  return {
    id: toNumOrNull(pick(src, 'id')) ?? undefined,
    variantId,
    productId,
    productName: String(pick(src, 'name', 'productName', 'product_name') ?? ''),
    sku: (pick<string>(src, 'sku') ?? null) as string | null,
    image: (pick<string>(src, 'image', 'imageUrl', 'path') ?? null) as string | null,
    label: String(pick(src, 'label') ?? ''),
    basePrice,
    baseStock: toNum(pick(src, 'stock', 'baseStock', 'base_stock')),
    flashPrice: toNum(
      pick(pivot, 'flash_price') ?? pick(src, 'flashPrice', 'flash_price'),
    ),
    flashStock: toNum(
      pick(pivot, 'stock') ?? pick(src, 'flashStock', 'flash_stock'),
    ),
    isActive: Boolean(pick(src, 'isActive', 'is_active') ?? true),
  };
}

export function normalizeFlashSale(raw: unknown): FlashSale {
  const source = unwrap(raw);
  const variantsRaw = pick<unknown[]>(source, 'variants', 'items');
  const productsRaw = pick<unknown[]>(source, 'products');
  const variants = Array.isArray(variantsRaw) && variantsRaw.length > 0
    ? variantsRaw.map(normalizeVariant)
    : Array.isArray(productsRaw)
      ? productsRaw.map(normalizeProductAsVariant)
      : [];

  return {
    id: toNum(pick(source, 'id'), 0),
    title: String(pick(source, 'title') ?? ''),
    description: (pick<string>(source, 'description') ?? null) as string | null,
    hasButton: Boolean(pick(source, 'hasButton', 'has_button') ?? false),
    buttonText: (pick<string>(source, 'buttonText', 'button_text') ?? null) as string | null,
    buttonUrl: (pick<string>(source, 'buttonUrl', 'button_url') ?? null) as string | null,
    startDatetime: String(
      pick(source, 'startDatetime', 'start_datetime', 'start_time') ?? '',
    ),
    endDatetime: String(
      pick(source, 'endDatetime', 'end_datetime', 'end_time') ?? '',
    ),
    isPublish: Boolean(pick(source, 'isPublish', 'is_publish', 'is_active') ?? false),
    order: toNum(pick(source, 'order'), 0),
    variants,
    createdAt: (pick<string>(source, 'createdAt', 'created_at') ?? null) as string | null,
    updatedAt: (pick<string>(source, 'updatedAt', 'updated_at') ?? null) as string | null,
  };
}

export function deriveFlashSaleStatus(
  sale: Pick<FlashSale, 'startDatetime' | 'endDatetime' | 'isPublish'>,
): FlashSaleStatus {
  if (!sale.isPublish) return FlashSaleStatus.Draft;
  const now = wibNow();
  const start = sale.startDatetime ? toWib(sale.startDatetime) : null;
  const end = sale.endDatetime ? toWib(sale.endDatetime) : null;
  if (start && now.isBefore(start)) return FlashSaleStatus.Upcoming;
  if (end && now.isAfter(end)) return FlashSaleStatus.Ended;
  return FlashSaleStatus.Active;
}

export function toFlashSaleListItem(sale: FlashSale): FlashSaleListItem {
  return {
    ...sale,
    status: deriveFlashSaleStatus(sale),
    totalVariants: sale.variants.length,
  };
}
