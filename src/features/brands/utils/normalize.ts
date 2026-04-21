import type { Brand } from '../types';

type UnknownRecord = Record<string, unknown>;

function pick<T>(source: UnknownRecord, ...keys: string[]): T | undefined {
  for (const key of keys) {
    const v = source[key];
    if (v !== undefined && v !== null) return v as T;
  }
  return undefined;
}

export function normalizeBrand(raw: unknown): Brand {
  const src = (raw ?? {}) as UnknownRecord;
  return {
    id: Number(pick(src, 'id') ?? 0),
    name: String(pick(src, 'name') ?? ''),
    slug: String(pick(src, 'slug') ?? ''),
    description: (pick<string>(src, 'description') ?? null) as string | null,
    logoUrl: (pick<string>(src, 'logoUrl', 'logo_url') ?? null) as string | null,
    bannerUrl: (pick<string>(src, 'bannerUrl', 'banner_url') ?? null) as string | null,
    country: (pick<string>(src, 'country') ?? null) as string | null,
    website: (pick<string>(src, 'website') ?? null) as string | null,
    isActive: Boolean(pick(src, 'isActive', 'is_active') ?? true),
    createdAt: (pick<string>(src, 'createdAt', 'created_at') ?? null) as string | null,
    updatedAt: (pick<string>(src, 'updatedAt', 'updated_at') ?? null) as string | null,
  };
}
