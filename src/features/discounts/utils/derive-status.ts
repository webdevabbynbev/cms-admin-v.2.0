import { toWib, wibNow } from '@/utils/timezone';
import { DiscountActiveFlag, DiscountStatus } from '../types';
import type { Discount } from '../types';

export function deriveDiscountStatus(discount: Pick<
  Discount,
  'isActive' | 'startedAt' | 'expiredAt'
>): DiscountStatus {
  if (discount.isActive !== DiscountActiveFlag.Active) {
    return DiscountStatus.Inactive;
  }
  const now = wibNow();
  const start = discount.startedAt ? toWib(discount.startedAt) : null;
  const end = discount.expiredAt ? toWib(discount.expiredAt) : null;

  if (start && now.isBefore(start)) return DiscountStatus.Upcoming;
  if (end && now.isAfter(end)) return DiscountStatus.Expired;
  return DiscountStatus.Active;
}
