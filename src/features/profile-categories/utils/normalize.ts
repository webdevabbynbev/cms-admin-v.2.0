import type { ProfileCategory, ProfileCategoryOption } from '../types';

type UnknownRecord = Record<string, unknown>;

function pick<T>(source: UnknownRecord, ...keys: string[]): T | undefined {
  for (const key of keys) {
    const v = source[key];
    if (v !== undefined && v !== null) return v as T;
  }
  return undefined;
}

export function normalizeProfileCategory(raw: unknown): ProfileCategory {
  const src = (raw ?? {}) as UnknownRecord;
  return {
    id: Number(pick(src, 'id') ?? 0),
    name: String(pick(src, 'name') ?? ''),
    type: (pick<string>(src, 'type') ?? null) as string | null,
    createdAt: (pick<string>(src, 'createdAt', 'created_at') ?? null) as string | null,
    updatedAt: (pick<string>(src, 'updatedAt', 'updated_at') ?? null) as string | null,
  };
}

export function normalizeProfileCategoryOption(
  raw: unknown,
): ProfileCategoryOption {
  const src = (raw ?? {}) as UnknownRecord;
  const category = pick<UnknownRecord>(src, 'category');
  return {
    id: Number(pick(src, 'id') ?? 0),
    profileCategoriesId: Number(
      pick(src, 'profileCategoriesId', 'profile_categories_id') ?? 0,
    ),
    label: String(pick(src, 'label') ?? ''),
    value: String(pick(src, 'value') ?? ''),
    isActive: Boolean(pick(src, 'isActive', 'is_active') ?? true),
    category: category
      ? {
          id: Number(pick(category, 'id') ?? 0),
          name: String(pick(category, 'name') ?? ''),
        }
      : null,
    createdAt: (pick<string>(src, 'createdAt', 'created_at') ?? null) as string | null,
    updatedAt: (pick<string>(src, 'updatedAt', 'updated_at') ?? null) as string | null,
  };
}
