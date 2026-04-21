import { toWib } from '@/utils/timezone';
import {
  DiscountActiveFlag,
  DiscountItemValueType,
  DiscountScope,
} from '../types';
import type { Discount, DiscountVariantItem } from '../types';
import type {
  DiscountFormValues,
  DiscountVariantItemFormValues,
} from '../schemas';
import {
  isAllProductsDiscount,
  parseAllProductsMarker,
} from './all-products-marker';

function toDatetimeLocal(value: string | null | undefined): string | null {
  if (!value) return null;
  const wib = toWib(value);
  if (!wib || !wib.isValid()) return null;
  return wib.format('YYYY-MM-DDTHH:mm');
}

function makeKey(item: DiscountVariantItem, index: number): string {
  return `item-${item.productVariantId || 'x'}-${item.id ?? index}`;
}

function toFormItem(
  item: DiscountVariantItem,
  index: number,
): DiscountVariantItemFormValues {
  const variant = item.variant ?? null;
  return {
    key: makeKey(item, index),
    productVariantId: item.productVariantId,
    productId: item.productId ?? variant?.productId ?? null,
    productName: variant?.product?.name ?? '',
    variantLabel: variant?.label ?? '',
    brandId: null,
    brandName: '',
    sku: variant?.sku ?? null,
    basePrice: variant?.price ?? null,
    stock: variant?.stock ?? null,
    isActive: item.isActive,
    valueType: item.valueType ?? DiscountItemValueType.Percent,
    value: item.value ?? null,
    maxDiscount: item.maxDiscount ?? null,
    promoStock: item.promoStock ?? null,
    purchaseLimit: item.purchaseLimit ?? null,
  };
}

export function hydrateDiscountForm(discount: Discount): DiscountFormValues {
  const allProducts = isAllProductsDiscount(discount.description);
  const { percent, maxDiscount } = parseAllProductsMarker(discount.description);
  const scope = allProducts ? DiscountScope.AllProducts : DiscountScope.Product;

  return {
    name: discount.name ?? '',
    code: discount.code ?? '',
    description: allProducts ? '' : (discount.description ?? ''),
    scope,
    isActive: discount.isActive === DiscountActiveFlag.Active,
    isEcommerce: discount.isEcommerce === DiscountActiveFlag.Active,
    isPos: discount.isPos === DiscountActiveFlag.Active,
    startedAt: toDatetimeLocal(discount.startedAt),
    expiredAt: toDatetimeLocal(discount.expiredAt),
    noExpiry: discount.noExpiry === DiscountActiveFlag.Active,
    daysOfWeek: discount.daysOfWeek ?? [],
    allProductsPercent: allProducts ? percent : null,
    allProductsMaxDiscount: allProducts ? maxDiscount : null,
    items: (discount.variantItems ?? []).map(toFormItem),
  };
}
