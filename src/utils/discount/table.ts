import helper from "../helper";
import { formatWibDateTime, toWib, wibNow } from "../timezone";
import type {
  DiscountRecord,
  DiscountVariantItem,
} from "../../services/api/discount/discount.types";

export const toIdNum = (id: any) => {
  const n = Number(id);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export const resolveIdentifier = (r: DiscountRecord) => {
  const idNum = toIdNum(r.id);
  if (idNum) return String(idNum);
  const code = String(r.code ?? "").trim();
  return code || null;
};

export const pick = <T>(r: any, ...keys: string[]): T | undefined => {
  for (const k of keys) {
    const v = r?.[k];
    if (v !== undefined && v !== null) return v as T;
  }
  return undefined;
};

export const toNumSafe = (v: any, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export const normalizeVariantItem = (
  it: DiscountVariantItem,
): DiscountVariantItem => {
  const pvId = toNumSafe(
    pick(it, "productVariantId", "product_variant_id") ?? 0,
    0,
  );
  const productIdRaw = pick(it, "productId", "product_id");
  const productId = productIdRaw === null ? null : toNumSafe(productIdRaw, 0);
  const isActive =
    typeof pick(it, "isActive") === "boolean"
      ? Boolean(pick(it, "isActive"))
      : Number(pick(it, "is_active") ?? 0) === 1;
  const vtRaw = pick<any>(it, "valueType", "value_type") ?? "percent";
  let valueType: string = "percent";
  if (typeof vtRaw === "number") valueType = vtRaw === 2 ? "fixed" : "percent";
  else {
    const s = String(vtRaw).toLowerCase().trim();
    valueType = s === "fixed" || s === "nominal" ? "fixed" : "percent";
  }
  const value = toNumSafe(pick(it, "value") ?? 0, 0);
  const maxDiscountRaw = pick(it, "maxDiscount", "max_discount");
  const maxDiscount =
    maxDiscountRaw === null || maxDiscountRaw === undefined
      ? null
      : toNumSafe(maxDiscountRaw, 0);
  const promoStockRaw = pick(it, "promoStock", "promo_stock");
  const promoStock =
    promoStockRaw === null || promoStockRaw === undefined
      ? null
      : toNumSafe(promoStockRaw, 0);
  const purchaseLimitRaw = pick(it, "purchaseLimit", "purchase_limit");
  const purchaseLimit =
    purchaseLimitRaw === null || purchaseLimitRaw === undefined
      ? null
      : toNumSafe(purchaseLimitRaw, 0);
  const variant = (it as any)?.variant ?? null;
  return {
    ...it,
    productVariantId: pvId,
    productId: productId && productId > 0 ? productId : null,
    isActive,
    valueType,
    value,
    maxDiscount,
    promoStock,
    purchaseLimit,
    variant,
  };
};

export const normalizeRow = (r: DiscountRecord) => {
  const valueType = Number(pick<number>(r, "valueType", "value_type") ?? 1);
  const appliesTo = Number(pick<number>(r, "appliesTo", "applies_to") ?? 0);
  const rawItems: any[] =
    (pick<any[]>(r, "variantItems", "variant_items") as any[]) ?? [];
  const variantItems: DiscountVariantItem[] = Array.isArray(rawItems)
    ? rawItems.map((it) => normalizeVariantItem(it as any))
    : [];
  return {
    ...r,
    id: pick(r, "id", "discountId", "discount_id") ?? r.id,
    name: pick(r, "name") ?? r.name ?? null,
    code: pick(r, "code") ?? r.code ?? null,
    valueType,
    value: pick(r, "value") ?? r.value ?? null,
    maxDiscount:
      pick(r, "maxDiscount", "max_discount") ?? r.maxDiscount ?? null,
    appliesTo,
    minOrderAmount:
      pick(r, "minOrderAmount", "min_order_amount") ?? r.minOrderAmount ?? null,
    isActive: Number(pick(r, "isActive", "is_active") ?? 0),
    isEcommerce: Number(pick(r, "isEcommerce", "is_ecommerce") ?? 0),
    isPos: Number(pick(r, "isPos", "is_pos") ?? 0),
    startedAt: pick(r, "startedAt", "started_at") ?? r.startedAt ?? null,
    expiredAt: pick(r, "expiredAt", "expired_at") ?? r.expiredAt ?? null,
    variantItems,
  } as DiscountRecord;
};

export const isAllProductsPromo = (r: DiscountRecord) => {
  const desc = String(r.description ?? "").toLowerCase();
  return desc.includes("[all_products]");
};

export const parseAllProductsInfo = (r: DiscountRecord) => {
  const desc = String(r.description ?? "");
  const matchPercent = desc.match(/percent=(\d+)/i);
  const matchMax = desc.match(/max=(\d+)/i);
  const percent = matchPercent ? toNumSafe(matchPercent[1], 0) : null;
  const maxDiscount = matchMax ? toNumSafe(matchMax[1], 0) : null;
  return {
    percent: percent !== null ? Math.max(0, Math.min(100, percent)) : null,
    maxDiscount: maxDiscount !== null && maxDiscount > 0 ? maxDiscount : null,
  };
};

export const promoStatus = (r: DiscountRecord) => {
  const active = Number(r.isActive) === 1;
  if (!active) return { label: "Nonaktif", color: "red" as const };
  const now = wibNow();
  const s = r.startedAt ? toWib(r.startedAt) : null;
  const e = r.expiredAt ? toWib(r.expiredAt) : null;
  if (s && now.isBefore(s))
    return { label: "Akan Datang", color: "blue" as const };
  if (e && now.isAfter(e))
    return { label: "Berakhir", color: "default" as const };
  return { label: "Sedang Berjalan", color: "green" as const };
};

export const formatDateTime = (dt?: string | null) => {
  return formatWibDateTime(dt);
};

export const formatRp = (n: number) =>
  `Rp.${helper.formatRupiah(String(Math.max(0, Math.round(n))))}`;

export const calcFinalPrice = (
  basePrice: number,
  vt: string,
  value: number,
) => {
  if (basePrice <= 0) return 0;
  if (vt === "fixed") return Math.max(0, Math.round(basePrice - value));
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return Math.max(0, Math.round((basePrice * (100 - pct)) / 100));
};
