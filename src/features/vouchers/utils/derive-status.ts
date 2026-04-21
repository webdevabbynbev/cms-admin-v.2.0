import { toWib, wibNow } from '@/utils/timezone';
import { VoucherActiveStatus } from '../types';
import type { Voucher } from '../types';

export type VoucherStatus = 'active' | 'upcoming' | 'expired' | 'inactive' | 'sold_out';

export const VOUCHER_STATUS_LABELS: Record<VoucherStatus, string> = {
  active: 'Sedang Berjalan',
  upcoming: 'Akan Datang',
  expired: 'Berakhir',
  inactive: 'Nonaktif',
  sold_out: 'Habis',
};

export function deriveVoucherStatus(
  voucher: Pick<
    Voucher,
    'isActive' | 'startedAt' | 'expiredAt' | 'qty' | 'usedCount'
  >,
): VoucherStatus {
  if (voucher.isActive !== VoucherActiveStatus.Active) return 'inactive';
  if (voucher.qty > 0 && voucher.usedCount >= voucher.qty) return 'sold_out';
  const now = wibNow();
  const start = voucher.startedAt ? toWib(voucher.startedAt) : null;
  const end = voucher.expiredAt ? toWib(voucher.expiredAt) : null;
  if (start && now.isBefore(start)) return 'upcoming';
  if (end && now.isAfter(end)) return 'expired';
  return 'active';
}
