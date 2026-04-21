import { formatWibDateTime, toWib } from '@/utils/timezone';

export function formatCustomerDateTime(value: string | null | undefined): string {
  if (!value) return '-';
  return formatWibDateTime(value);
}

export function formatCustomerDate(value: string | null | undefined): string {
  if (!value) return '-';
  const wib = toWib(value);
  if (!wib || !wib.isValid()) return '-';
  return wib.format('DD MMMM YYYY');
}

export function formatCustomerPhone(
  phone: string | null | undefined,
  phoneNumber: string | null | undefined,
): string {
  return phone || phoneNumber || '-';
}
