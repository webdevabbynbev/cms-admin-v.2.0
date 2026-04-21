import type { Concern, ConcernOption } from '../types';

type UnknownRecord = Record<string, unknown>;

function pick<T>(source: UnknownRecord, ...keys: string[]): T | undefined {
  for (const key of keys) {
    const v = source[key];
    if (v !== undefined && v !== null) return v as T;
  }
  return undefined;
}

export function normalizeConcern(raw: unknown): Concern {
  const src = (raw ?? {}) as UnknownRecord;
  return {
    id: Number(pick(src, 'id') ?? 0),
    name: String(pick(src, 'name') ?? ''),
    slug: String(pick(src, 'slug') ?? ''),
    description: (pick<string>(src, 'description') ?? null) as string | null,
    position: Number(pick(src, 'position') ?? 0),
    createdAt: (pick<string>(src, 'createdAt', 'created_at') ?? null) as string | null,
    updatedAt: (pick<string>(src, 'updatedAt', 'updated_at') ?? null) as string | null,
  };
}

export function normalizeConcernOption(raw: unknown): ConcernOption {
  const src = (raw ?? {}) as UnknownRecord;
  const concernRaw = pick<UnknownRecord>(src, 'concern');
  return {
    id: Number(pick(src, 'id') ?? 0),
    concernId: Number(pick(src, 'concernId', 'concern_id') ?? 0),
    name: String(pick(src, 'name') ?? ''),
    slug: String(pick(src, 'slug') ?? ''),
    description: (pick<string>(src, 'description') ?? null) as string | null,
    position: Number(pick(src, 'position') ?? 0),
    concern: concernRaw
      ? {
          id: Number(pick(concernRaw, 'id') ?? 0),
          name: String(pick(concernRaw, 'name') ?? ''),
          slug: String(pick(concernRaw, 'slug') ?? ''),
        }
      : null,
    createdAt: (pick<string>(src, 'createdAt', 'created_at') ?? null) as string | null,
    updatedAt: (pick<string>(src, 'updatedAt', 'updated_at') ?? null) as string | null,
  };
}
