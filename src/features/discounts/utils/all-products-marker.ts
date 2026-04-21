import { DISCOUNT_ALL_PRODUCTS_MARKER } from '../types';

export interface AllProductsMarkerInfo {
  percent: number | null;
  maxDiscount: number | null;
}

export function isAllProductsDiscount(
  description: string | null | undefined,
): boolean {
  if (!description) return false;
  return description.toUpperCase().includes(DISCOUNT_ALL_PRODUCTS_MARKER);
}

export function parseAllProductsMarker(
  description: string | null | undefined,
): AllProductsMarkerInfo {
  if (!description) return { percent: null, maxDiscount: null };
  const matchPercent = description.match(/percent=(\d+)/i);
  const matchMax = description.match(/max=(\d+)/i);
  const percentRaw = matchPercent ? Number(matchPercent[1]) : NaN;
  const maxRaw = matchMax ? Number(matchMax[1]) : NaN;
  return {
    percent: Number.isFinite(percentRaw)
      ? Math.max(0, Math.min(100, percentRaw))
      : null,
    maxDiscount: Number.isFinite(maxRaw) && maxRaw > 0 ? maxRaw : null,
  };
}

export function buildAllProductsMarker(
  percent: number,
  maxDiscount: number | null,
): string {
  const parts = [DISCOUNT_ALL_PRODUCTS_MARKER, `percent=${Math.round(percent)}`];
  if (maxDiscount != null && maxDiscount > 0) {
    parts.push(`max=${Math.round(maxDiscount)}`);
  }
  return parts.join('|');
}
