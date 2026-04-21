import { AdminRole } from '../types';
import type { Admin } from '../types';

type UnknownRecord = Record<string, unknown>;

function pick<T>(source: UnknownRecord, ...keys: string[]): T | undefined {
  for (const key of keys) {
    const v = source[key];
    if (v !== undefined && v !== null) return v as T;
  }
  return undefined;
}

function parsePermissions(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter((v): v is string => typeof v === 'string');
  }
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    return Object.keys(obj).filter((k) => obj[k] === true);
  }
  if (typeof raw === 'string') {
    try {
      return parsePermissions(JSON.parse(raw));
    } catch {
      return [];
    }
  }
  return [];
}

function toRole(value: unknown): AdminRole | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const valid: AdminRole[] = [
    AdminRole.Admin,
    AdminRole.Gudang,
    AdminRole.Finance,
    AdminRole.Media,
    AdminRole.CashierGudang,
    AdminRole.Cashier,
  ];
  return valid.includes(n as AdminRole) ? (n as AdminRole) : null;
}

export function normalizeAdmin(raw: unknown): Admin {
  const src = (raw ?? {}) as UnknownRecord;
  const firstName = String(pick(src, 'firstName', 'first_name') ?? '');
  const lastName = String(pick(src, 'lastName', 'last_name') ?? '');
  const combined =
    pick<string>(src, 'name') ?? `${firstName} ${lastName}`.trim();

  return {
    id: Number(pick(src, 'id') ?? 0),
    firstName,
    lastName,
    name: combined,
    email: String(pick(src, 'email') ?? ''),
    role: toRole(pick(src, 'role')),
    roleName: String(pick(src, 'roleName', 'role_name') ?? ''),
    permissions: parsePermissions(pick(src, 'permissions')),
    isActive: Boolean(pick(src, 'isActive', 'is_active') ?? true),
    createdAt: (pick<string>(src, 'createdAt', 'created_at') ?? null) as string | null,
    updatedAt: (pick<string>(src, 'updatedAt', 'updated_at') ?? null) as string | null,
  };
}

export function permissionsArrayToObject(
  permissions: string[],
): Record<string, true> {
  const obj: Record<string, true> = {};
  for (const p of permissions) obj[p] = true;
  return obj;
}
