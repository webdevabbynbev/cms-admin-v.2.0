import { formatWibDateTime } from '@/utils/timezone';

export function formatFlashSaleCurrency(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return 'Rp 0';
  const rounded = Math.max(0, Math.round(value));
  return `Rp ${new Intl.NumberFormat('id-ID').format(rounded)}`;
}

export function formatFlashSaleDateTime(value: string | null | undefined): string {
  if (!value) return '-';
  return formatWibDateTime(value);
}

export function calculateFlashSaleDiscount(
  basePrice: number,
  flashPrice: number,
): number {
  if (basePrice <= 0) return 0;
  return Math.max(
    0,
    Math.round(((basePrice - flashPrice) / basePrice) * 100),
  );
}
