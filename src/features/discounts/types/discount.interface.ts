import type {
  DiscountActiveFlag,
  DiscountAppliesTo,
  DiscountDayOfWeek,
  DiscountImportFormat,
  DiscountItemValueType,
  DiscountScope,
  DiscountStatus,
} from './discount.enum';

export interface DiscountVariantRef {
  id: number;
  productId: number | null;
  sku: string | null;
  price: number | null;
  stock: number | null;
  label: string | null;
  product: {
    id: number;
    name: string;
  } | null;
}

export interface DiscountVariantItem {
  id?: number;
  discountId?: number;
  productId: number | null;
  productVariantId: number;
  isActive: boolean;
  valueType: DiscountItemValueType;
  value: number | null;
  maxDiscount: number | null;
  promoStock: number | null;
  purchaseLimit: number | null;
  variant?: DiscountVariantRef | null;
}

export interface Discount {
  id: number;
  name: string;
  code: string;
  description: string | null;
  valueType: number;
  value: number;
  maxDiscount: number | null;
  appliesTo: DiscountAppliesTo;
  minOrderAmount: number | null;
  isActive: DiscountActiveFlag;
  isAuto: DiscountActiveFlag;
  isEcommerce: DiscountActiveFlag;
  isPos: DiscountActiveFlag;
  startedAt: string | null;
  expiredAt: string | null;
  noExpiry: DiscountActiveFlag;
  daysOfWeek: DiscountDayOfWeek[];
  variantItems: DiscountVariantItem[];
  qty?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface DiscountListItem extends Discount {
  status: DiscountStatus;
}

export interface DiscountListQuery {
  q?: string;
  page: number;
  perPage: number;
}

export interface DiscountVariantItemPayload {
  product_variant_id: number;
  product_id: number | null;
  is_active: DiscountActiveFlag;
  value_type: DiscountItemValueType;
  value: number;
  max_discount: number | null;
  promo_stock: number | null;
  purchase_limit: number | null;
}

export interface DiscountFormPayload {
  name: string;
  code: string;
  description: string | null;
  value_type: number;
  value: number;
  max_discount: number | null;
  applies_to: DiscountAppliesTo;
  is_active: DiscountActiveFlag;
  is_auto: DiscountActiveFlag;
  is_ecommerce: DiscountActiveFlag;
  is_pos: DiscountActiveFlag;
  started_at: string | null;
  expired_at: string | null;
  no_expiry: DiscountActiveFlag;
  days_of_week: DiscountDayOfWeek[];
  days_of_week_mask: number;
  items: DiscountVariantItemPayload[];
}

export interface DiscountStatusPayload {
  id: number | string;
  code?: string;
  isActive: DiscountActiveFlag;
  isEcommerce?: DiscountActiveFlag;
  isPos?: DiscountActiveFlag;
}

export interface DiscountOptionQuery {
  q?: string;
  page?: number;
  perPage?: number;
  brandId?: number | string;
  ids?: Array<number | string>;
  productId?: number | string;
  variantIds?: Array<number | string>;
  withVariants?: DiscountActiveFlag;
  loadAll?: DiscountActiveFlag;
}

export interface DiscountBrandOption {
  id: number;
  name: string;
  slug?: string | null;
  logo?: string | null;
}

export interface DiscountProductOption {
  id: number;
  name: string;
  slug?: string | null;
  masterSku?: string | null;
  brand?: { id: number; name: string } | null;
  variants?: DiscountVariantRef[];
}

export interface DiscountVariantOption extends DiscountVariantRef {
  productName?: string | null;
  brandId?: number | null;
  brandName?: string | null;
}

export interface DiscountImportParams {
  format: DiscountImportFormat;
  scope: DiscountScope;
}

export interface DiscountListFilters {
  search?: string;
  status?: DiscountStatus;
  scope?: DiscountScope;
  channel?: 'ecommerce' | 'pos';
  page: number;
  perPage: number;
}

export interface AllProductsMarkerInfo {
  percent: number | null;
  maxDiscount: number | null;
}
