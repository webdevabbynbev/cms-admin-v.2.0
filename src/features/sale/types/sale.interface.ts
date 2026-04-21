export interface SaleVariant {
  variantId: number;
  productId: number;
  productName: string;
  variantLabel: string;
  sku: string | null;
  imageUrl: string | null;
  basePrice: number;
  baseStock: number;
  salePrice: number;
  saleStock: number;
}

export interface Sale {
  id: number;
  title: string | null;
  description: string | null;
  startDatetime: string;
  endDatetime: string;
  isPublish: boolean;
  hasButton: boolean;
  buttonText: string | null;
  buttonUrl: string | null;
  variantCount: number;
}

export interface SaleDetail extends Sale {
  variants: SaleVariant[];
}

export interface SaleListQuery {
  q?: string;
  status?: string;
  page: number;
  perPage: number;
}

export interface SaleVariantPayload {
  variant_id: number;
  sale_price: number;
  stock: number;
}

export interface SalePayload {
  title: string | null;
  description: string | null;
  start_datetime: string;
  end_datetime: string;
  is_publish: boolean;
  has_button: boolean;
  button_text: string | null;
  button_url: string | null;
  variants: SaleVariantPayload[];
}
