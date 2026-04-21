import type { ReferralCode } from '../types';

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

export function normalizeReferralCode(raw: unknown): ReferralCode {
  const src = (raw ?? {}) as UnknownRecord;
  return {
    id: toNum(pick(src, 'id')),
    code: String(pick(src, 'code') ?? ''),
    discountPercent: toNum(pick(src, 'discountPercent', 'discount_percent')),
    maxUsesTotal: toNum(pick(src, 'maxUsesTotal', 'max_uses_total')),
    usedCount: toNum(pick(src, 'usedCount', 'used_count')),
    isActive: Boolean(pick(src, 'isActive', 'is_active') ?? true),
    startedAt: (pick<string>(src, 'startedAt', 'started_at') ?? null) as string | null,
    expiredAt: (pick<string>(src, 'expiredAt', 'expired_at') ?? null) as string | null,
    createdAt: (pick<string>(src, 'createdAt', 'created_at') ?? null) as string | null,
    updatedAt: (pick<string>(src, 'updatedAt', 'updated_at') ?? null) as string | null,
  };
}
