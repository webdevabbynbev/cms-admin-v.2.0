import type { Sale, SaleDetail, SaleVariant } from '../types';

function buildVariantLabel(raw: Record<string, unknown>): string {
  const label = (raw.variantLabel ?? raw.variant_label ?? raw.label) as string | null;
  if (label) return label;
  const attrs = Array.isArray(raw.attributes) ? raw.attributes as Record<string, unknown>[] : [];
  if (attrs.length > 0) {
    return attrs
      .map((a) => {
        const attr = a.attribute as Record<string, unknown> | null;
        return `${attr?.name ?? ''}: ${a.value ?? ''}`;
      })
      .filter(Boolean)
      .join(', ');
  }
  return String(raw.sku ?? raw.barcode ?? '');
}

function getFirstImage(medias: unknown): string | null {
  if (!Array.isArray(medias) || medias.length === 0) return null;
  const img = (medias as Record<string, unknown>[]).find((m) => m.type === 1);
  return (img?.url ?? (medias as Record<string, unknown>[])[0]?.url ?? null) as string | null;
}

export function normalizeSaleVariant(raw: Record<string, unknown>): SaleVariant {
  const product = (raw.product ?? {}) as Record<string, unknown>;
  const pivot = (raw.pivot ?? {}) as Record<string, unknown>;

  const productName = String(
    product.name ?? raw.productName ?? raw.product_name ?? '',
  );
  const imageUrl =
    getFirstImage(product.medias) ??
    (raw.image as string | null) ??
    null;

  return {
    variantId: Number(raw.id ?? raw.variantId ?? raw.variant_id ?? 0),
    productId: Number(product.id ?? raw.productId ?? raw.product_id ?? 0),
    productName,
    variantLabel: buildVariantLabel(raw),
    sku: (raw.sku as string | null) ?? null,
    imageUrl,
    basePrice: Number(raw.price ?? 0),
    baseStock: Number(raw.stock ?? 0),
    salePrice: Number(pivot.sale_price ?? raw.salePrice ?? raw.sale_price ?? raw.price ?? 0),
    saleStock: Number(pivot.stock ?? raw.saleStock ?? raw.sale_stock ?? raw.stock ?? 0),
  };
}

export function normalizeSale(raw: unknown): Sale {
  const r = raw as Record<string, unknown>;
  const variants = Array.isArray(r.variants) ? r.variants : (Array.isArray(r.products) ? r.products : []);
  return {
    id: Number(r.id ?? 0),
    title: (r.title as string | null) ?? null,
    description: (r.description as string | null) ?? null,
    startDatetime: String(r.startDatetime ?? r.start_datetime ?? ''),
    endDatetime: String(r.endDatetime ?? r.end_datetime ?? ''),
    isPublish: Boolean(r.isPublish ?? r.is_publish ?? false),
    hasButton: Boolean(r.hasButton ?? r.has_button ?? false),
    buttonText: (r.buttonText ?? r.button_text ?? null) as string | null,
    buttonUrl: (r.buttonUrl ?? r.button_url ?? null) as string | null,
    variantCount: variants.length,
  };
}

export function normalizeSaleDetail(raw: unknown): SaleDetail {
  const r = raw as Record<string, unknown>;
  const rawVariants = Array.isArray(r.variants)
    ? r.variants as Record<string, unknown>[]
    : [];
  return {
    ...normalizeSale(raw),
    variants: rawVariants.map(normalizeSaleVariant),
  };
}
