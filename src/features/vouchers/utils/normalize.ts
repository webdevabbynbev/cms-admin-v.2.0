import {
  VoucherActiveStatus,
  VoucherRewardType,
  VoucherScopeType,
  VoucherType,
  VoucherValueMode,
} from '../types';
import type { Voucher } from '../types';

type UnknownRecord = Record<string, unknown>;

function unwrap(source: unknown): UnknownRecord {
  const raw = (source ?? {}) as UnknownRecord;
  const attrs = raw.$attributes as UnknownRecord | undefined;
  const original = raw.$original as UnknownRecord | undefined;
  return { ...(attrs ?? {}), ...(original ?? {}), ...raw };
}

function pick<T>(source: UnknownRecord, ...keys: string[]): T | undefined {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null) return value as T;
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

function toIdArray(value: unknown): number[] {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .map((v) => Number(typeof v === 'object' && v && 'id' in v ? (v as UnknownRecord).id : v))
          .filter((n) => Number.isFinite(n) && n > 0),
      ),
    );
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((v) => Number(v.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);
  }
  return [];
}

function toActiveStatus(value: unknown): VoucherActiveStatus {
  if (value === true) return VoucherActiveStatus.Active;
  if (value === false) return VoucherActiveStatus.Inactive;
  return Number(value) === 2
    ? VoucherActiveStatus.Inactive
    : VoucherActiveStatus.Active;
}

export function normalizeVoucher(raw: unknown): Voucher {
  const source = unwrap(raw);
  const giftProductsRaw = pick<unknown[]>(
    source,
    'giftProducts',
    'gift_products',
  );
  const giftFromRelation = Array.isArray(giftProductsRaw)
    ? giftProductsRaw
    : undefined;
  const giftProductIds = toIdArray(
    pick(
      source,
      'giftProductIds',
      'gift_product_ids',
      'giftProductId',
      'gift_product_id',
    ) ?? giftFromRelation,
  );
  const giftProductName =
    pick<string>(source, 'giftProductName', 'gift_product_name') ??
    (Array.isArray(giftFromRelation) && giftFromRelation[0]
      ? String(
          (giftFromRelation[0] as UnknownRecord).name ??
            (giftFromRelation[0] as UnknownRecord).productName ??
            '',
        )
      : null);

  return {
    id: toNum(pick(source, 'id'), 0),
    name: String(pick(source, 'name') ?? ''),
    code: String(pick(source, 'code') ?? ''),
    type: toNum(pick(source, 'type'), VoucherType.Product) as VoucherType,
    rewardType:
      (toNumOrNull(pick(source, 'rewardType', 'reward_type')) as
        | VoucherRewardType
        | null) ?? null,
    isPercentage: (toNum(
      pick(source, 'isPercentage', 'is_percentage'),
      VoucherValueMode.Percentage,
    ) as VoucherValueMode),
    price: toNumOrNull(pick(source, 'price')),
    percentage: toNumOrNull(pick(source, 'percentage')),
    maxDiscPrice: toNumOrNull(pick(source, 'maxDiscPrice', 'max_disc_price')),
    minPurchaseAmount: toNumOrNull(
      pick(
        source,
        'minPurchaseAmount',
        'min_purchase_amount',
        'minimumPurchase',
        'minimum_purchase',
      ),
    ),
    qty: toNum(pick(source, 'qty'), 0),
    usedCount: toNum(pick(source, 'usedCount', 'used_count'), 0),
    perUserLimit: toNumOrNull(pick(source, 'perUserLimit', 'per_user_limit')),
    isActive: toActiveStatus(pick(source, 'isActive', 'is_active')),
    isVisible: Boolean(pick(source, 'isVisible', 'is_visible') ?? true),
    isStackable: Boolean(
      pick(source, 'isStackable', 'is_stackable', 'stackable') ?? true,
    ),
    isVoucherStackable: Boolean(
      pick(
        source,
        'isVoucherStackable',
        'is_voucher_stackable',
        'voucher_stackable',
      ) ?? true,
    ),
    scopeType: toNum(
      pick(source, 'scopeType', 'scope_type'),
      VoucherScopeType.All,
    ) as VoucherScopeType,
    scopeIds: toIdArray(pick(source, 'scopeIds', 'scope_ids')),
    giftProductIds,
    giftProductName,
    startedAt:
      (pick<string>(source, 'startedAt', 'started_at') ?? null) as string | null,
    expiredAt:
      (pick<string>(source, 'expiredAt', 'expired_at') ?? null) as string | null,
    createdAt:
      (pick<string>(source, 'createdAt', 'created_at') ?? null) as string | null,
    updatedAt:
      (pick<string>(source, 'updatedAt', 'updated_at') ?? null) as string | null,
  };
}
