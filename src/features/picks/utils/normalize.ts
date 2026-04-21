import type { PickRecord, PickProduct } from '../types';

function normalizePickProduct(raw: Record<string, unknown>): PickProduct {
  const medias = Array.isArray(raw.medias) ? raw.medias as Record<string, unknown>[] : [];
  const firstImage = medias.find((m) => m.type === 1 || m.type === 'image');
  const imageUrl = (firstImage?.url ?? medias[0]?.url ?? null) as string | null;

  const variants = Array.isArray(raw.variants)
    ? raw.variants as Record<string, unknown>[]
    : [];
  const totalStock = variants.reduce((sum, v) => sum + Number(v.stock ?? 0), 0);

  const brand = raw.brand as Record<string, unknown> | null;
  const categoryType = (raw.categoryType ?? raw.category_type) as Record<string, unknown> | null;

  return {
    id: Number(raw.id ?? 0),
    name: String(raw.name ?? ''),
    masterSku: ((raw.masterSku ?? raw.master_sku) as string | null) ?? null,
    imageUrl,
    brandName: brand ? String(brand.name ?? '') : null,
    categoryTypeName: categoryType ? String(categoryType.name ?? '') : null,
    totalStock,
  };
}

export function normalizePickRecord(raw: unknown): PickRecord {
  const r = raw as Record<string, unknown>;
  return {
    id: Number(r.id ?? 0),
    order: Number(r.order ?? 0),
    isActive: Boolean(r.isActive ?? r.is_active ?? false),
    productId: Number(r.productId ?? r.product_id ?? 0),
    startDate: ((r.startDate ?? r.start_date) as string | null) ?? null,
    endDate: ((r.endDate ?? r.end_date) as string | null) ?? null,
    product: r.product ? normalizePickProduct(r.product as Record<string, unknown>) : null,
  };
}
