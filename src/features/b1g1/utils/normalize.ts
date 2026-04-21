import type { B1g1 } from '../types';

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

export function normalizeB1g1(raw: unknown): B1g1 {
  const src = (raw ?? {}) as UnknownRecord;
  return {
    id: Number(pick(src, 'id') ?? 0),
    name: String(pick(src, 'name') ?? ''),
    code: String(pick(src, 'code') ?? ''),
    description: (pick<string>(src, 'description') ?? null) as string | null,
    isActive: Boolean(pick(src, 'isActive', 'is_active') ?? true),
    isEcommerce: Boolean(pick(src, 'isEcommerce', 'is_ecommerce') ?? true),
    isPos: Boolean(pick(src, 'isPos', 'is_pos') ?? false),
    applyTo: String(pick(src, 'applyTo', 'apply_to') ?? 'all'),
    brandId: toNumOrNull(pick(src, 'brandId', 'brand_id')),
    usageLimit: toNumOrNull(pick(src, 'usageLimit', 'usage_limit')),
    minimumPurchase: toNumOrNull(pick(src, 'minimumPurchase', 'minimum_purchase')),
    startedAt: (pick<string>(src, 'startedAt', 'started_at') ?? null) as string | null,
    expiredAt: (pick<string>(src, 'expiredAt', 'expired_at') ?? null) as string | null,
    createdAt: (pick<string>(src, 'createdAt', 'created_at') ?? null) as string | null,
    updatedAt: (pick<string>(src, 'updatedAt', 'updated_at') ?? null) as string | null,
  };
}
