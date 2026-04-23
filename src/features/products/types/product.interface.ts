import type {
  MediaType,
  ProductStatus,
  ProductStatusFilter,
  SeoStatusFilter,
} from './product.enum';

export interface Brand {
  id: number;
  name: string;
  slug?: string;
  description?: string | null;
  logo?: string | null;
  banner?: string | null;
}

export interface ProductMedia {
  id?: number;
  url: string;
  type: MediaType;
  slot?: number;
  variantId?: number | null;
}

export interface ProductTag {
  id: number;
  name: string;
}

export interface ProductVariant {
  id?: number;
  combination?: Array<number | string>;
  price: number | string;
  basePrice?: number | string;
  stock: number;
  sku: string;
  skuVariant1?: string;
  barcode?: string;
  weight?: number;
  bpom?: string;
  photoVariant?: string | null;
  skintone?: string;
  undertone?: string;
  finish?: string;
  warna?: string;
  perfumeFor?: string;
  mainAccords?: string[];
  topNotes?: string[];
  middleNotes?: string[];
  baseNotes?: string[];
}

export interface ProductListItem {
  id: number;
  name: string;
  slug: string;
  masterSku: string;
  description?: string;
  isFlashSale: boolean;
  status: ProductStatus;
  categoryTypeId?: number | null;
  brandId?: number | null;
  personaId?: number | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  metaAi?: boolean | null;
  position: number;
  path?: string;
  priceDisplay?: string | number | null;
  isGift?: boolean;
  isVisibleEcommerce?: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  brand?: Brand | null;
  medias?: ProductMedia[];
  tags?: ProductTag[];
  variants?: ProductVariant[];
}

export interface ProductConcernOption {
  id: number;
  name?: string;
}

export interface ProductProfileOption {
  id: number;
  label?: string;
}

export interface ProductCategoryRef {
  id: number;
  name?: string;
}

export interface ProductDetail extends ProductListItem {
  howToUse?: string | null;
  ingredients?: string | null;
  bpom?: string | null;
  mainAccords?: string | null;
  topNotes?: string | null;
  middleNotes?: string | null;
  baseNotes?: string | null;
  perfumeFor?: string | null;
  finish?: string | null;
  warna?: string | null;
  concernOptions?: ProductConcernOption[];
  concern_options?: ProductConcernOption[];
  concernOptionIds?: number[];
  concern_option_ids?: number[];
  profileOptions?: ProductProfileOption[];
  profile_category_options?: ProductProfileOption[];
  profileCategoryOptionIds?: number[];
  profile_category_option_ids?: number[];
  categoryTypes?: ProductCategoryRef[];
  category_types?: ProductCategoryRef[];
  categoryTypeIds?: number[];
  category_type_ids?: number[];
}

export interface ProductListQuery {
  name?: string;
  status?: string;
  brandId?: number | null;
  isFlashsale?: boolean;
  seoStatus?: string;
  page: number;
  perPage: number;
}

export interface ProductReorderPayload {
  updates: Array<{ id: number; order: number }>;
}

export interface CategoryFlags {
  isMakeup: boolean;
  isPerfume: boolean;
  isSkincare: boolean;
}

export interface ProductFilterState {
  name: string;
  status: ProductStatusFilter;
  brandId: number | null;
  seoStatus: SeoStatusFilter;
}
