import type { Ned } from '../types';

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

export function normalizeNed(raw: unknown): Ned {
  const src = (raw ?? {}) as UnknownRecord;
  return {
    id: Number(pick(src, 'id') ?? 0),
    name: String(pick(src, 'name') ?? ''),
    description: (pick<string>(src, 'description') ?? null) as string | null,
    sku: (pick<string>(src, 'sku') ?? null) as string | null,
    price: toNumOrNull(pick(src, 'price')),
    quantity: toNumOrNull(pick(src, 'quantity')),
    isActive: Boolean(pick(src, 'isActive', 'is_active') ?? true),
    isVisibleEcommerce: Boolean(
      pick(src, 'isVisibleEcommerce', 'is_visible_ecommerce') ?? true,
    ),
    isVisiblePos: Boolean(pick(src, 'isVisiblePos', 'is_visible_pos') ?? false),
    createdAt: (pick<string>(src, 'createdAt', 'created_at') ?? null) as string | null,
    updatedAt: (pick<string>(src, 'updatedAt', 'updated_at') ?? null) as string | null,
  };
}
