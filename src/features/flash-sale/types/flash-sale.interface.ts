import type { FlashSaleStatus } from './flash-sale.enum';

export interface FlashSaleVariant {
  id?: number;
  variantId: number;
  productId: number;
  productName: string;
  sku: string | null;
  image: string | null;
  label: string;
  basePrice: number;
  baseStock: number;
  flashPrice: number;
  flashStock: number;
  isActive: boolean;
}

export interface FlashSale {
  id: number;
  title: string;
  description: string | null;
  hasButton: boolean;
  buttonText: string | null;
  buttonUrl: string | null;
  startDatetime: string;
  endDatetime: string;
  isPublish: boolean;
  order: number;
  variants: FlashSaleVariant[];
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface FlashSaleListItem extends FlashSale {
  status: FlashSaleStatus;
  totalVariants: number;
}

export interface FlashSaleVariantPayload {
  variant_id: number;
  flash_price: number;
  stock: number;
}

export interface FlashSaleFormPayload {
  title: string;
  description: string | null;
  has_button: boolean;
  button_text: string | null;
  button_url: string | null;
  start_datetime: string;
  end_datetime: string;
  is_publish: boolean;
  variants: FlashSaleVariantPayload[];
}

export interface FlashSaleReorderPayload {
  updates: Array<{ id: number; order: number }>;
}
