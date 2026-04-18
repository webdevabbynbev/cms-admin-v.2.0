import { toNumberOrNull } from "../../../utils/voucher/number";

export type VoucherNormalized = {
  id: number | string;
  name: string;
  code: string;
  reward_type?: number | null;
  gift_product_name?: string | null;
  gift_product_ids?: number[];
  min_purchase_amount?: number | null;
  price?: number | null;
  percentage?: number | null;
  maxDiscPrice?: number | null;
  isPercentage: number;
  isActive: number;
  isVisible: boolean;
  type: number;
  qty: number;
  usedCount?: number;
  perUserLimit?: number | null;
  isStackable?: boolean;
  isVoucherStackable?: boolean;
  scopeType?: number;
  scopeIds?: number[];
  startedAt: string;
  expiredAt: string;
};

const unwrapModel = (item: any) => {
  return item?.$attributes ?? item?.$original ?? item ?? {};
};

const toActiveFlag = (v: any): number => {
  if (v === true) return 1;
  if (v === false) return 2;
  const n = Number(v);
  if (!Number.isNaN(n)) return n;
  return 1;
};

export const normalizeVoucherEntity = (raw: any): VoucherNormalized => {
  const v = unwrapModel(raw);
  const startedAt = String(v?.startedAt ?? v?.started_at ?? "");
  const expiredAt = String(v?.expiredAt ?? v?.expired_at ?? "");
  const rewardTypeRaw = v?.rewardType ?? v?.reward_type ?? null;
  const giftProductName =
    v?.giftProductName ??
    v?.gift_product_name ??
    v?.giftProduct?.name ??
    v?.gift_product?.name ??
    raw?.giftProductName ??
    raw?.gift_product_name ??
    raw?.giftProduct?.name ??
    raw?.gift_product?.name ??
    raw?.gift_products?.[0]?.name ??
    raw?.giftProducts?.[0]?.name ??
    v?.gift_products?.[0]?.name ??
    v?.giftProducts?.[0]?.name ??
    null;
  const giftProductIdsRaw =
    v?.gift_product_ids ??
    v?.giftProductIds ??
    v?.gift_product_id ??
    v?.giftProductId ??
    v?.gift_products?.map?.((item: any) => item?.id) ??
    v?.giftProducts?.map?.((item: any) => item?.id) ??
    raw?.gift_product_ids ??
    raw?.giftProductIds ??
    raw?.gift_product_id ??
    raw?.giftProductId ??
    raw?.gift_products?.map?.((item: any) => item?.id) ??
    raw?.giftProducts?.map?.((item: any) => item?.id) ??
    [];
  const giftProductIds = Array.from(
    new Set(
      (
        Array.isArray(giftProductIdsRaw)
          ? giftProductIdsRaw
          : String(giftProductIdsRaw || "").split(",")
      )
        .map((id: any) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0),
    ),
  );
  const usedCount =
    toNumberOrNull(
      v?.usedCount ?? v?.used_count ?? raw?.usedCount ?? raw?.used_count,
    ) ?? 0;
  const isPercentage = Number(v?.isPercentage ?? v?.is_percentage ?? 1);
  const isActive = toActiveFlag(v?.isActive ?? raw?.isActive ?? v?.is_active);
  const minPurchaseAmount =
    v?.minPurchaseAmount ??
    v?.min_purchase_amount ??
    v?.minimumPurchase ??
    v?.minimum_purchase ??
    v?.product_min_purchase_amount;
  const price = v?.price;
  const maxDiscPrice = v?.maxDiscPrice ?? v?.max_disc_price;
  const percentage = v?.percentage;
  const perUserLimit = v?.perUserLimit ?? v?.per_user_limit ?? null;
  const rawIsStackable =
    v?.isStackable ?? v?.is_stackable ?? v?.stackable ?? v?.can_stack;
  const isStackable =
    rawIsStackable === undefined || rawIsStackable === null
      ? true
      : Boolean(rawIsStackable);
  const rawIsVoucherStackable =
    v?.isVoucherStackable ??
    v?.is_voucher_stackable ??
    v?.voucher_stackable ??
    v?.can_stack_voucher;
  const isVoucherStackable =
    rawIsVoucherStackable === undefined || rawIsVoucherStackable === null
      ? isStackable
      : Boolean(rawIsVoucherStackable);
  const scopeType = Number(v?.scopeType ?? v?.scope_type ?? 0);
  const scopeIdsRaw = v?.scopeIds ?? v?.scope_ids ?? [];
  const scopeIds = Array.from(
    new Set(
      (
        Array.isArray(scopeIdsRaw)
          ? scopeIdsRaw
          : String(scopeIdsRaw || "").split(",")
      )
        .map((id: any) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0),
    ),
  );

  const rawIsVisible = v?.isVisible ?? v?.is_visible ?? raw?.isVisible ?? raw?.is_visible;
  const isVisible = rawIsVisible === undefined || rawIsVisible === null ? true : Boolean(rawIsVisible);

  return {
    id: v?.id ?? raw?.id ?? "",
    name: String(v?.name ?? ""),
    code: String(v?.code ?? ""),
    reward_type:
      rewardTypeRaw === null || rewardTypeRaw === undefined
        ? null
        : Number(rewardTypeRaw),
    gift_product_name:
      giftProductName === null ? null : String(giftProductName),
    gift_product_ids: giftProductIds,
    min_purchase_amount:
      minPurchaseAmount === null ? null : toNumberOrNull(minPurchaseAmount),
    price: price === null ? null : toNumberOrNull(price),
    percentage: percentage === null ? null : toNumberOrNull(percentage),
    maxDiscPrice: maxDiscPrice === null ? null : toNumberOrNull(maxDiscPrice),
    isPercentage,
    isActive,
    isVisible,
    type: Number(v?.type ?? 1),
    qty: Number(v?.qty ?? 0),
    usedCount,
    perUserLimit: toNumberOrNull(perUserLimit),
    isStackable,
    isVoucherStackable,
    scopeType,
    scopeIds,
    startedAt,
    expiredAt,
  };
};
