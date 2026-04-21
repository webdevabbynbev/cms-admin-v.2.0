import type { CrmAffiliate, CrmMember } from '../types';

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

export function normalizeMember(raw: unknown): CrmMember {
  const src = (raw ?? {}) as UnknownRecord;
  return {
    id: toNum(pick(src, 'id')),
    name: String(pick(src, 'name') ?? ''),
    email: String(pick(src, 'email') ?? ''),
    phoneNumber: (pick<string>(src, 'phoneNumber', 'phone_number') ?? null) as string | null,
    photoProfileUrl: (pick<string>(src, 'photoProfileUrl', 'photo_profile_url') ?? null) as string | null,
    isActive: Boolean(pick(src, 'isActive', 'is_active') ?? true),
    emailVerified: (pick<string>(src, 'emailVerified', 'email_verified') ?? null) as string | null,
    crmTier: String(pick(src, 'crmTier', 'crm_tier') ?? 'Customer'),
    referralCode: (pick<string>(src, 'referralCode', 'referral_code') ?? null) as string | null,
    totalOrders: toNum(pick(src, 'totalOrders', 'total_orders')),
    ltv: toNum(pick(src, 'ltv')),
    section: (pick<string>(src, 'section') ?? null) as string | null,
    profileCompletion: toNum(pick(src, 'profilCompletion', 'profile_completion', 'profil_completion')),
    createdAt: (pick<string>(src, 'createdAt', 'created_at') ?? null) as string | null,
  };
}

export function normalizeAffiliate(raw: unknown): CrmAffiliate {
  const src = (raw ?? {}) as UnknownRecord;
  return {
    id: toNum(pick(src, 'id')),
    code: String(pick(src, 'code') ?? ''),
    discountPercent: toNum(pick(src, 'discountPercent', 'discount_percent')),
    isActive: Boolean(pick(src, 'isActive', 'is_active') ?? true),
    expiredAt: (pick<string>(src, 'expiredAt', 'expired_at') ?? null) as string | null,
    totalRedemptions: toNum(pick(src, 'totalRedemptions', 'total_redemptions')),
    totalDiscountGiven: toNum(pick(src, 'totalDiscountGiven', 'total_discount_given')),
    komisiEarned: toNum(pick(src, 'komisiEarned', 'komisi_earned')),
    createdAt: (pick<string>(src, 'createdAt', 'created_at') ?? null) as string | null,
  };
}
