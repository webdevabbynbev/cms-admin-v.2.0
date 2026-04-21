import type { StockMovement } from '../types';

type UnknownRecord = Record<string, unknown>;

function pick<T>(source: UnknownRecord, ...keys: string[]): T | undefined {
  for (const key of keys) {
    const v = source[key];
    if (v !== undefined && v !== null) return v as T;
  }
  return undefined;
}

function toNumOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function normalizeStockMovement(raw: unknown): StockMovement {
  const src = (raw ?? {}) as UnknownRecord;
  const variant = pick<UnknownRecord>(src, 'variant');
  const product = variant ? pick<UnknownRecord>(variant, 'product') : undefined;
  return {
    id: Number(pick(src, 'id') ?? 0),
    change: Number(pick(src, 'change') ?? 0),
    type: String(pick(src, 'type') ?? ''),
    note: (pick<string>(src, 'note') ?? null) as string | null,
    variant: variant
      ? {
          id: toNumOrNull(pick(variant, 'id')),
          sku: (pick<string>(variant, 'sku') ?? null) as string | null,
          barcode: (pick<string>(variant, 'barcode') ?? null) as string | null,
          productName: product
            ? String(pick(product, 'name') ?? '')
            : null,
        }
      : null,
    createdAt: (pick<string>(src, 'createdAt', 'created_at') ?? null) as string | null,
  };
}
