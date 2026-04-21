export interface GiftProduct {
  id: number;
  brandId: number | null;
  brandName: string | null;
  productName: string;
  variantName: string | null;
  productVariantSku: string | null;
  productVariantId: number | null;
  isSellable: boolean;
  price: number;
  stock: number;
  weight: number;
  imageUrl: string | null;
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface GiftListQuery {
  q?: string;
  page: number;
  perPage: number;
}

export interface GiftPayload {
  brand_id: number | null;
  brand_name: string | null;
  product_name: string;
  variant_name: string | null;
  product_variant_sku: string | null;
  product_variant_id: number | null;
  is_sellable: boolean;
  price: number;
  stock: number;
  weight: number;
  image_url: string | null;
  is_active: boolean;
}
