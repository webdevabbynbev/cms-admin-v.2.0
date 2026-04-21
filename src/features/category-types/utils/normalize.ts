import type { CategoryType } from '../types';

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

export function normalizeCategoryType(raw: unknown): CategoryType {
  const src = (raw ?? {}) as UnknownRecord;
  return {
    id: Number(pick(src, 'id') ?? 0),
    name: String(pick(src, 'name') ?? ''),
    slug: String(pick(src, 'slug') ?? ''),
    parentId: toNumOrNull(pick(src, 'parentId', 'parent_id')),
    level: Number(pick(src, 'level') ?? 0),
    iconPublicId: (pick<string>(src, 'iconPublicId', 'icon_public_id') ?? null) as string | null,
    iconUrl: (pick<string>(src, 'iconUrl', 'icon_url') ?? null) as string | null,
    productsCount: Number(pick(src, 'productsCount', 'products_count') ?? 0),
    createdAt: (pick<string>(src, 'createdAt', 'created_at') ?? null) as string | null,
    updatedAt: (pick<string>(src, 'updatedAt', 'updated_at') ?? null) as string | null,
  };
}
