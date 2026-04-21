import type { Faq } from '../types';

type UnknownRecord = Record<string, unknown>;

function pick<T>(source: UnknownRecord, ...keys: string[]): T | undefined {
  for (const key of keys) {
    const v = source[key];
    if (v !== undefined && v !== null) return v as T;
  }
  return undefined;
}

export function normalizeFaq(raw: unknown): Faq {
  const src = (raw ?? {}) as UnknownRecord;
  return {
    id: Number(pick(src, 'id') ?? 0),
    question: String(pick(src, 'question') ?? ''),
    answer: String(pick(src, 'answer') ?? ''),
    createdAt: (pick<string>(src, 'createdAt', 'created_at') ?? null) as string | null,
    updatedAt: (pick<string>(src, 'updatedAt', 'updated_at') ?? null) as string | null,
  };
}
