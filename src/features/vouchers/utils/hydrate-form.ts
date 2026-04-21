import { toWib } from '@/utils/timezone';
import {
  VoucherActiveStatus,
  VoucherRewardType,
  VoucherType,
} from '../types';
import type { Voucher } from '../types';
import type { VoucherFormValues } from '../schemas';

function toDatetimeLocal(value: string | null | undefined): string | null {
  if (!value) return null;
  const wib = toWib(value);
  if (!wib || !wib.isValid()) return null;
  return wib.format('YYYY-MM-DDTHH:mm');
}

export function hydrateVoucherForm(voucher: Voucher): VoucherFormValues {
  return {
    id: voucher.id,
    name: voucher.name,
    code: voucher.code,
    type: voucher.type ?? VoucherType.Product,
    rewardType: voucher.rewardType ?? VoucherRewardType.Discount,
    valueMode: voucher.isPercentage,
    price: voucher.price,
    percentage: voucher.percentage,
    maxDiscPrice: voucher.maxDiscPrice,
    minPurchaseAmount: voucher.minPurchaseAmount,
    qty: voucher.qty,
    perUserLimit: voucher.perUserLimit,
    isActive: voucher.isActive === VoucherActiveStatus.Active,
    isVisible: voucher.isVisible,
    isStackable: voucher.isStackable,
    isVoucherStackable: voucher.isVoucherStackable,
    scopeType: voucher.scopeType,
    scopeIds: voucher.scopeIds,
    giftProductIds: voucher.giftProductIds,
    startedAt: toDatetimeLocal(voucher.startedAt),
    expiredAt: toDatetimeLocal(voucher.expiredAt),
  };
}
