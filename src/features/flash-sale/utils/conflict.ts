import axios from 'axios';
import type { FlashSaleConflict, FlashSaleConflictResult } from '../types';

interface AnyRecord {
  [key: string]: unknown;
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function toStringOrNull(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  return String(value);
}

function normalizeConflictRow(row: unknown): FlashSaleConflict | null {
  if (row == null) return null;
  if (typeof row === 'number' || typeof row === 'string') {
    const id = asNumber(row);
    return id != null ? { variantId: id } : null;
  }
  if (typeof row !== 'object') return null;
  const r = row as AnyRecord;
  const variantId =
    asNumber(r.variant_id) ??
    asNumber(r.variantId) ??
    asNumber(r.id) ??
    asNumber((r.variant as AnyRecord | undefined)?.id);
  if (variantId == null) return null;

  const product = r.product as AnyRecord | undefined;
  const promo = r.promo as AnyRecord | undefined;
  return {
    variantId,
    productId:
      asNumber(r.product_id) ??
      asNumber(r.productId) ??
      asNumber(product?.id) ??
      null,
    productName:
      toStringOrNull(r.product_name) ??
      toStringOrNull(r.productName) ??
      toStringOrNull(product?.name) ??
      null,
    promoName:
      toStringOrNull(r.promo_name) ??
      toStringOrNull(r.promoName) ??
      toStringOrNull(promo?.name) ??
      toStringOrNull(r.discount_name) ??
      null,
    message: toStringOrNull(r.message) ?? null,
  };
}

const CONFLICT_CODES = new Set([
  'DISCOUNT_CONFLICT',
  'FLASH_SALE_CONFLICT',
  'PROMO_CONFLICT',
]);

export function parseFlashSaleConflict(
  error: unknown,
): FlashSaleConflictResult | null {
  if (!axios.isAxiosError(error) || error.response?.status !== 409) return null;

  const body = error.response.data as AnyRecord | undefined;
  if (!body) return null;

  const serve = body.serve ?? body;
  const serveArray = Array.isArray(serve) ? serve : null;
  const serveObj = serveArray ? null : (serve as AnyRecord);

  const isConflictCode =
    typeof serveObj?.code === 'string' && CONFLICT_CODES.has(serveObj.code);

  const rawList: unknown =
    serveObj?.conflicts ?? serveObj?.variants ?? serveObj?.items ?? serveArray;

  if (!Array.isArray(rawList)) {
    return isConflictCode
      ? { conflicts: [], message: toStringOrNull(body.message) }
      : null;
  }

  const conflicts = rawList
    .map(normalizeConflictRow)
    .filter((x): x is FlashSaleConflict => x !== null);

  if (conflicts.length === 0 && !isConflictCode) return null;

  return {
    conflicts,
    message: toStringOrNull(body.message),
  };
}
