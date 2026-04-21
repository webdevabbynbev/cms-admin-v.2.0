import type { ActivityLog } from '../types';

type UnknownRecord = Record<string, unknown>;

function pick<T>(source: UnknownRecord, ...keys: string[]): T | undefined {
  for (const key of keys) {
    const v = source[key];
    if (v !== undefined && v !== null) return v as T;
  }
  return undefined;
}

function parseDataArray(raw: unknown): Record<string, unknown> | null {
  if (!raw) return null;
  if (typeof raw === 'object') return raw as Record<string, unknown>;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' && parsed !== null
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }
  return null;
}

export function normalizeActivityLog(raw: unknown): ActivityLog {
  const src = (raw ?? {}) as UnknownRecord;
  return {
    id: Number(pick(src, 'id') ?? 0),
    roleName: String(pick(src, 'roleName', 'role_name') ?? ''),
    userName: String(pick(src, 'userName', 'user_name') ?? ''),
    activity: String(pick(src, 'activity') ?? ''),
    menu: (pick<string>(src, 'menu') ?? null) as string | null,
    data: (pick<string>(src, 'data') ?? null) as string | null,
    dataArray:
      parseDataArray(pick(src, 'dataArray', 'data_array')) ??
      parseDataArray(pick(src, 'data')),
    createdAt: (pick<string>(src, 'createdAt', 'created_at') ?? null) as string | null,
    updatedAt: (pick<string>(src, 'updatedAt', 'updated_at') ?? null) as string | null,
  };
}
