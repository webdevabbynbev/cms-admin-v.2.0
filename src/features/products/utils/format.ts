import type { ProductListItem, ProductMedia } from '../types';

export function formatPrice(value: number | string | null | undefined): string {
  const num = Number(value ?? 0);
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);
}

export function getProductPrimaryImage(product: ProductListItem): string | null {
  const medias = product.medias ?? [];
  const image = medias.find((m: ProductMedia) => m.type === 1) ?? medias[0];
  return image?.url ?? null;
}

export function getProductTotalStock(product: ProductListItem): number {
  const variants = product.variants ?? [];
  if (variants.length === 0) return 0;
  return variants.reduce((total, v) => total + (Number(v.stock) || 0), 0);
}

export function hasSeoFilled(product: ProductListItem): boolean {
  return Boolean(
    product.metaTitle?.trim() &&
      product.metaDescription?.trim() &&
      product.metaKeywords?.trim(),
  );
}
