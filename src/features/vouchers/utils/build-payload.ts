import moment from 'moment-timezone';
import { WIB_TZ } from '@/utils/timezone';
import {
  VoucherActiveStatus,
  VoucherRewardType,
  VoucherType,
  VoucherValueMode,
} from '../types';
import type { VoucherFormPayload } from '../types';
import type { VoucherFormValues } from '../schemas';

function toIsoWib(value: string | null): string | null {
  if (!value) return null;
  const parsed = moment.tz(value, 'YYYY-MM-DDTHH:mm', WIB_TZ);
  return parsed.isValid() ? parsed.toISOString() : null;
}

export function buildVoucherPayload(
  values: VoucherFormValues,
): VoucherFormPayload {
  return {
    ...(values.id ? { id: values.id } : {}),
    name: values.name.trim(),
    code: values.code.trim().toUpperCase(),
    type: values.type,
    reward_type:
      values.type === VoucherType.Gift
        ? VoucherRewardType.FreeItem
        : values.rewardType,
    is_percentage: values.valueMode,
    price:
      values.valueMode === VoucherValueMode.Fixed ? values.price : null,
    percentage:
      values.valueMode === VoucherValueMode.Percentage
        ? values.percentage
        : null,
    max_disc_price:
      values.valueMode === VoucherValueMode.Percentage
        ? values.maxDiscPrice
        : null,
    min_purchase_amount: values.minPurchaseAmount,
    qty: values.qty,
    per_user_limit: values.perUserLimit,
    is_active: values.isActive
      ? VoucherActiveStatus.Active
      : VoucherActiveStatus.Inactive,
    is_visible: values.isVisible,
    is_stackable: values.isStackable,
    is_voucher_stackable: values.isVoucherStackable,
    scope_type: values.scopeType,
    scope_ids: values.scopeIds,
    gift_product_ids:
      values.type === VoucherType.Gift ? values.giftProductIds : [],
    started_at: toIsoWib(values.startedAt),
    expired_at: toIsoWib(values.expiredAt),
  };
}
