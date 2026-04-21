import { formatWibDate, formatWibDateTime } from '@/utils/timezone';

export function formatVoucherCurrency(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return 'Rp 0';
  const rounded = Math.max(0, Math.round(value));
  return `Rp ${new Intl.NumberFormat('id-ID').format(rounded)}`;
}

export function formatVoucherPercent(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '0%';
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}

export function formatVoucherDate(value: string | null | undefined): string {
  if (!value) return '-';
  return formatWibDate(value);
}

export function formatVoucherDateTime(value: string | null | undefined): string {
  if (!value) return '-';
  return formatWibDateTime(value);
}
