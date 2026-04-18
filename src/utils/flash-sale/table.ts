import helper from "../helper";
import { formatWibDateTime, toWib, wibNow } from "../timezone";
import type {
  FlashSaleItem,
  FlashSaleRow,
  ProductGroupRow,
} from "../../services/api/flash-sale/flashsale.types";

export const toIdNum = (id: any) => {
  const n = Number(id);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export const pick = <T>(r: any, ...keys: string[]): T | undefined => {
  for (const k of keys) {
    const v = r?.[k];
    if (v !== undefined && v !== null) return v as T;
  }
  return undefined;
};

const pickMediaUrl = (medias?: any[]) => {
  if (!Array.isArray(medias) || medias.length === 0) return null;
  const main = medias.find((m: any) => Number(m?.type ?? 0) === 1);
  return (main?.url ?? medias[0]?.url ?? null) as string | null;
};

const resolveItemImage = (it: any) => {
  const direct = pick<any>(
    it,
    "image",
    "image_url",
    "thumbnail",
    "thumb",
    "cover",
    "path",
  );
  if (direct) return String(direct);
  const variantMedia = pickMediaUrl(it?.medias) || pickMediaUrl(it?.media);
  if (variantMedia) return variantMedia;
  const product = it?.product ?? {};
  const productDirect = pick<any>(
    product,
    "image",
    "image_url",
    "thumbnail",
    "thumb",
    "cover",
    "path",
  );
  if (productDirect) return String(productDirect);
  return pickMediaUrl(product?.medias) || pickMediaUrl(product?.media) || null;
};

export const toNumSafe = (v: any, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export const isPromoStockInactive = (promoStock: number | null | undefined) =>
  promoStock !== null &&
  promoStock !== undefined &&
  toNumSafe(promoStock, 0) <= 0;

export const isPublished = (r: FlashSaleRow) => {
  const raw = pick<any>(r, "isPublish", "is_publish", "is_active");
  if (typeof raw === "boolean") return raw;
  return Number(raw ?? 0) === 1;
};

export const promoStatus = (r: FlashSaleRow) => {
  const published = isPublished(r);
  if (!published) return { label: "Nonaktif", color: "red" as const };

  const now = wibNow();
  const startRaw = r.start_time ?? r.startDatetime;
  const endRaw = r.end_time ?? r.endDatetime;
  const s = startRaw ? toWib(startRaw) : null;
  const e = endRaw ? toWib(endRaw) : null;

  if (s && s.isValid() && now.isBefore(s))
    return { label: "Akan Datang", color: "blue" as const };
  if (e && e.isValid() && now.isAfter(e))
    return { label: "Berakhir", color: "default" as const };

  return { label: "Sedang Berjalan", color: "green" as const };
};

export const formatDateTime = (dt?: string | null) => {
  return formatWibDateTime(dt);
};

export const formatRp = (n: number) =>
  `Rp.${helper.formatRupiah(String(Math.max(0, Math.round(n))))}`;

export const calcPercentOff = (base: number, price: number) => {
  if (base <= 0) return null;
  const pct = Math.round(((base - price) / base) * 100);
  return Math.max(0, Math.min(100, pct));
};

export const normalizeItem = (it: any, idx: number): FlashSaleItem => {
  const id =
    pick<any>(
      it,
      "id",
      "productId",
      "product_id",
      "variant_id",
      "product_variant_id",
    ) ?? null;

  const label = String(
    pick<any>(it, "label", "variantLabel", "variant_label") ??
      pick<any>(it?.variant, "label", "variantLabel", "variant_label") ??
      pick<any>(it, "name", "productName", "product_name") ??
      pick<any>(it, "sku") ??
      (id ? `Item ${id}` : "Item"),
  );

  const sku = pick<any>(it, "sku", "masterSku", "master_sku") ?? null;

  const basePrice = toNumSafe(
    pick<any>(it, "price", "basePrice", "base_price") ?? 0,
    0,
  );
  const baseStock = toNumSafe(
    pick<any>(it, "stock", "baseStock", "base_stock") ?? 0,
    0,
  );

  const flashPriceRaw =
    it?.pivot?.flash_price ??
    it?.pivot?.flashPrice ??
    it?.flash_price ??
    it?.flashPrice ??
    it?.pivot_flash_price;
  const flashPrice =
    flashPriceRaw === undefined || flashPriceRaw === null
      ? null
      : toNumSafe(flashPriceRaw, 0);

  const promoStockRaw =
    it?.pivot?.stock ?? it?.flash_stock ?? it?.flashStock ?? it?.pivot_stock;
  const promoStock =
    promoStockRaw === undefined || promoStockRaw === null
      ? null
      : toNumSafe(promoStockRaw, 0);

  const productIdRaw =
    pick<any>(it, "productId", "product_id") ??
    pick<any>(it?.product, "id", "product_id");
  const productId = toIdNum(productIdRaw ?? id);
  const productName =
    pick<any>(it, "productName", "product_name") ??
    pick<any>(it?.product, "name", "product_name") ??
    (productId ? `Product ${productId}` : label);
  const image = resolveItemImage(it);

  const key = id ?? sku ?? `${idx}`;

  return {
    __key: String(key),
    id,
    label,
    sku: sku ? String(sku) : null,
    image,
    productId,
    productName: productName ? String(productName) : null,
    basePrice,
    baseStock,
    flashPrice,
    promoStock,
    pivotId: toIdNum(it?.pivot?.id ?? it?.pivot_id),
  };
};

export const groupPromoItems = (items: FlashSaleItem[]) => {
  const map = new Map<string, ProductGroupRow>();

  for (const it of items) {
    const pid = toIdNum(it.productId ?? it.id ?? null);
    const key = pid ? `p-${pid}` : `p-${it.__key ?? "unknown"}`;
    const name =
      (it.productName && String(it.productName).trim()) ||
      (it.label && String(it.label).trim()) ||
      (pid ? `Product ${pid}` : "Produk");

    const existing = map.get(key);
    if (existing) {
      existing.variants.push(it);
      existing.totalVariants = existing.variants.length;
      if (!existing.image && it.image) existing.image = it.image;
      continue;
    }

    map.set(key, {
      key,
      productId: pid,
      productName: name,
      image: it.image ?? null,
      totalVariants: 1,
      variants: [it],
      pivotId: it.pivotId,
    });
  }

  return Array.from(map.values());
};

export const getPromoItems = (r: FlashSaleRow): FlashSaleItem[] => {
  const items = [...(r.variants ?? []), ...(r.products ?? [])];
  return items.map((it, i) => normalizeItem(it, i));
};

export const countProducts = (r: FlashSaleRow) => {
  const ids = new Set<number>();

  for (const p of r.products ?? []) {
    const id = toNumSafe(p?.id ?? p?.product_id ?? p?.productId, 0);
    if (id > 0) ids.add(id);
  }

  for (const v of r.variants ?? []) {
    const id = toNumSafe(
      v?.productId ?? v?.product_id ?? v?.product?.id ?? v?.product?.product_id,
      0,
    );
    if (id > 0) ids.add(id);
  }

  return ids.size;
};
