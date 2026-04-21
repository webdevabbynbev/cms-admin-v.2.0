import type { AbandonedCart, AbandonedCartItem } from '../types';

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

function normalizeCartItem(raw: unknown): AbandonedCartItem {
  const src = (raw ?? {}) as UnknownRecord;
  const product = pick<UnknownRecord>(src, 'product') ?? {};
  const medias = pick<unknown[]>(product, 'medias');
  const firstImage =
    Array.isArray(medias) && medias[0] && typeof medias[0] === 'object'
      ? (medias[0] as UnknownRecord).url
      : null;
  return {
    id: toNum(pick(src, 'id')),
    productName: String(pick(product, 'name') ?? '(unnamed)'),
    qty: toNum(pick(src, 'qty')),
    attributes: (pick<string>(src, 'attributes') ?? null) as string | null,
    price: toNum(pick(product, 'price')),
    imageUrl: (firstImage as string | null) ?? null,
  };
}

export function normalizeAbandonedCart(raw: unknown): AbandonedCart {
  const src = (raw ?? {}) as UnknownRecord;
  const itemsRaw = pick<unknown[]>(src, 'carts', 'items') ?? [];
  return {
    id: toNum(pick(src, 'id')),
    userId:
      pick<unknown>(src, 'userId', 'user_id') != null
        ? toNum(pick(src, 'userId', 'user_id'))
        : null,
    name: String(pick(src, 'name') ?? ''),
    email: String(pick(src, 'email') ?? ''),
    phoneNumber: (pick<string>(src, 'phoneNumber', 'phone_number') ?? null) as string | null,
    items: Array.isArray(itemsRaw) ? itemsRaw.map(normalizeCartItem) : [],
    abandonedValue: toNum(pick(src, 'abandonedValue', 'abandoned_value')),
    totalOrders: toNum(pick(src, 'totalOrders', 'total_orders')),
    ltv: toNum(pick(src, 'ltv')),
    recoveryRate: toNum(pick(src, 'recoveryRate', 'recovery_rate')),
    lastActivity: (pick<string>(src, 'lastActivity', 'last_activity') ?? null) as string | null,
    createdAt: (pick<string>(src, 'createdAt', 'created_at') ?? null) as string | null,
    updatedAt: (pick<string>(src, 'updatedAt', 'updated_at') ?? null) as string | null,
  };
}
