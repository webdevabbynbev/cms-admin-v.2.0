import { formatWibDate, formatWibDateTime } from '@/utils/timezone';

export function formatDiscountCurrency(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return 'Rp 0';
  const rounded = Math.max(0, Math.round(value));
  const formatted = new Intl.NumberFormat('id-ID').format(rounded);
  return `Rp ${formatted}`;
}

export function formatDiscountPercent(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '0%';
  const rounded = Math.max(0, Math.min(100, Math.round(value)));
  return `${rounded}%`;
}

export function formatDiscountDate(value: string | null | undefined): string {
  if (!value) return '-';
  return formatWibDate(value);
}

export function formatDiscountDateTime(value: string | null | undefined): string {
  if (!value) return '-';
  return formatWibDateTime(value);
}

export function calcDiscountFinalPrice(
  basePrice: number,
  valueType: 'percent' | 'fixed',
  value: number,
): number {
  if (basePrice <= 0) return 0;
  if (valueType === 'fixed') {
    return Math.max(0, Math.round(basePrice - value));
  }
  const pct = Math.max(0, Math.min(100, value));
  return Math.max(0, Math.round((basePrice * (100 - pct)) / 100));
}
