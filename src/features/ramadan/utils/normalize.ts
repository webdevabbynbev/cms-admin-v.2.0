import type {
  RamadanParticipant,
  RamadanRecommendation,
  RamadanRecommendationBanner,
  RamadanSpinPrize,
} from '../types';

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

function toNumOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function normalizeSpinPrize(raw: unknown): RamadanSpinPrize {
  const src = (raw ?? {}) as UnknownRecord;
  return {
    id: toNum(pick(src, 'id')),
    name: String(pick(src, 'name') ?? ''),
    weight: toNum(pick(src, 'weight')),
    isGrand: Boolean(pick(src, 'isGrand', 'is_grand') ?? false),
    isActive: Boolean(pick(src, 'isActive', 'is_active') ?? true),
    dailyQuota: toNumOrNull(pick(src, 'dailyQuota', 'daily_quota')),
    voucherId: toNumOrNull(pick(src, 'voucherId', 'voucher_id')),
    voucherQty: toNum(pick(src, 'voucherQty', 'voucher_qty'), 1),
    createdAt: (pick<string>(src, 'createdAt', 'created_at') ?? null) as string | null,
    updatedAt: (pick<string>(src, 'updatedAt', 'updated_at') ?? null) as string | null,
  };
}

export function normalizeRecommendation(raw: unknown): RamadanRecommendation {
  const src = (raw ?? {}) as UnknownRecord;
  return {
    id: toNum(pick(src, 'id')),
    productId: toNumOrNull(pick(src, 'productId', 'product_id')),
    productName: String(pick(src, 'productName', 'product_name') ?? ''),
    position: toNum(pick(src, 'position')),
    isActive: Boolean(pick(src, 'isActive', 'is_active') ?? true),
    createdAt: (pick<string>(src, 'createdAt', 'created_at') ?? null) as string | null,
    updatedAt: (pick<string>(src, 'updatedAt', 'updated_at') ?? null) as string | null,
  };
}

export function normalizeRecommendationBanner(
  raw: unknown,
): RamadanRecommendationBanner {
  const src = (raw ?? {}) as UnknownRecord;
  return {
    id: toNum(pick(src, 'id')),
    title: String(pick(src, 'title') ?? ''),
    bannerDate: (pick<string>(src, 'bannerDate', 'banner_date') ?? null) as string | null,
    imageUrl: (pick<string>(src, 'imageUrl', 'image_url') ?? null) as string | null,
    imageType: String(pick(src, 'imageType', 'image_type') ?? 'upload'),
    imageMobileUrl: (pick<string>(src, 'imageMobileUrl', 'image_mobile_url') ?? null) as string | null,
    imageMobileType: String(pick(src, 'imageMobileType', 'image_mobile_type') ?? 'upload'),
    createdAt: (pick<string>(src, 'createdAt', 'created_at') ?? null) as string | null,
    updatedAt: (pick<string>(src, 'updatedAt', 'updated_at') ?? null) as string | null,
  };
}

export function normalizeParticipant(raw: unknown): RamadanParticipant {
  const src = (raw ?? {}) as UnknownRecord;
  return {
    id: toNum(pick(src, 'id')),
    name: String(pick(src, 'name') ?? ''),
    email: String(pick(src, 'email') ?? ''),
    phoneNumber: (pick<string>(src, 'phoneNumber', 'phone_number') ?? null) as string | null,
    address: (pick<string>(src, 'address') ?? null) as string | null,
    totalFasting: toNum(pick(src, 'totalFasting', 'total_fasting')),
    totalNotFasting: toNum(pick(src, 'totalNotFasting', 'total_not_fasting')),
    notFastingReasons: (pick<string>(src, 'notFastingReasons', 'not_fasting_reasons') ?? null) as string | null,
    spinResult: (pick<string>(src, 'spinResult', 'spin_result') ?? null) as string | null,
    prize7: (pick<string>(src, 'prize7', 'prize_7') ?? null) as string | null,
    prize15: (pick<string>(src, 'prize15', 'prize_15') ?? null) as string | null,
    prize30: (pick<string>(src, 'prize30', 'prize_30') ?? null) as string | null,
  };
}
