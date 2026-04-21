import { CustomerGender } from '../types';
import type { Customer } from '../types';

type UnknownRecord = Record<string, unknown>;

function pick<T>(source: UnknownRecord, ...keys: string[]): T | undefined {
  for (const key of keys) {
    const v = source[key];
    if (v !== undefined && v !== null) return v as T;
  }
  return undefined;
}

function toStringOrNull(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  return String(value);
}

function toGender(value: unknown): CustomerGender {
  const n = Number(value);
  if (n === CustomerGender.Male) return CustomerGender.Male;
  if (n === CustomerGender.Female) return CustomerGender.Female;
  return CustomerGender.Unspecified;
}

export function normalizeCustomer(raw: unknown): Customer {
  const src = (raw ?? {}) as UnknownRecord;
  const firstName = String(pick(src, 'firstName', 'first_name') ?? '');
  const lastName = String(pick(src, 'lastName', 'last_name') ?? '');
  const combinedName = pick<string>(src, 'name') ?? `${firstName} ${lastName}`.trim();

  return {
    id: Number(pick(src, 'id') ?? 0),
    firstName,
    lastName,
    name: combinedName,
    email: String(pick(src, 'email') ?? ''),
    phone: toStringOrNull(pick(src, 'phone')),
    phoneNumber: toStringOrNull(pick(src, 'phoneNumber', 'phone_number')),
    gender: toGender(pick(src, 'gender')),
    dob: toStringOrNull(pick(src, 'dob')),
    address: toStringOrNull(pick(src, 'address')),
    isActive: Boolean(pick(src, 'isActive', 'is_active') ?? true),
    role: pick(src, 'role') != null ? Number(pick(src, 'role')) : null,
    roleName: toStringOrNull(pick(src, 'roleName', 'role_name')),
    crmTier: toStringOrNull(pick(src, 'crmTier', 'crm_tier')),
    referralCode: toStringOrNull(pick(src, 'referralCode', 'referral_code')),
    emailVerified: toStringOrNull(pick(src, 'emailVerified', 'email_verified')),
    photoProfileUrl: toStringOrNull(
      pick(src, 'photoProfileUrl', 'photo_profile_url', 'photoProfile'),
    ),
    createdAt: toStringOrNull(pick(src, 'createdAt', 'created_at')),
    updatedAt: toStringOrNull(pick(src, 'updatedAt', 'updated_at')),
  };
}
