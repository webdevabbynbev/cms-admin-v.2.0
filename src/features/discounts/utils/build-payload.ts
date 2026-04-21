import moment from 'moment-timezone';
import { WIB_TZ } from '@/utils/timezone';
import {
  DiscountActiveFlag,
  DiscountAppliesTo,
  DiscountScope,
} from '../types';
import type {
  DiscountFormPayload,
  DiscountVariantItemPayload,
} from '../types';
import type {
  DiscountFormValues,
  DiscountVariantItemFormValues,
} from '../schemas';
import { buildAllProductsMarker } from './all-products-marker';

function toIsoWib(value: string | null): string | null {
  if (!value) return null;
  const parsed = moment.tz(value, 'YYYY-MM-DDTHH:mm', WIB_TZ);
  return parsed.isValid() ? parsed.toISOString() : null;
}

function toFlag(value: boolean): DiscountActiveFlag {
  return value ? DiscountActiveFlag.Active : DiscountActiveFlag.Inactive;
}

function daysOfWeekToMask(days: DiscountFormValues['daysOfWeek']): number {
  return days.reduce((acc, d) => {
    const bit = Number(d);
    return Number.isInteger(bit) && bit >= 0 && bit < 7 ? acc | (1 << bit) : acc;
  }, 0);
}

function toItemPayload(
  item: DiscountVariantItemFormValues,
): DiscountVariantItemPayload {
  return {
    product_variant_id: item.productVariantId,
    product_id: item.productId ?? null,
    is_active: toFlag(item.isActive),
    value_type: item.valueType,
    value: item.value ?? 0,
    max_discount: item.maxDiscount ?? null,
    promo_stock: item.promoStock ?? null,
    purchase_limit: item.purchaseLimit ?? null,
  };
}

export function buildDiscountPayload(
  values: DiscountFormValues,
): DiscountFormPayload {
  const isAllProducts = values.scope === DiscountScope.AllProducts;

  const description = isAllProducts
    ? buildAllProductsMarker(
        values.allProductsPercent ?? 0,
        values.allProductsMaxDiscount,
      )
    : values.description || null;

  return {
    name: values.name.trim(),
    code: values.code.trim(),
    description,
    value_type: 1,
    value: 0,
    max_discount: null,
    applies_to: DiscountAppliesTo.Products,
    is_active: toFlag(values.isActive),
    is_auto: DiscountActiveFlag.Active,
    is_ecommerce: toFlag(values.isEcommerce),
    is_pos: toFlag(values.isPos),
    started_at: values.noExpiry ? null : toIsoWib(values.startedAt),
    expired_at: values.noExpiry ? null : toIsoWib(values.expiredAt),
    no_expiry: toFlag(values.noExpiry),
    days_of_week: values.daysOfWeek,
    days_of_week_mask: daysOfWeekToMask(values.daysOfWeek),
    items: isAllProducts ? [] : values.items.map(toItemPayload),
  };
}
