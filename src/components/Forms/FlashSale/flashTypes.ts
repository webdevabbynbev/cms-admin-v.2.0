import type { Dayjs } from "dayjs";

export type FlashSaleVariantInput = {
  variant_id: number;
  flash_price: number;
  stock: number;
};

export type FlashSaleRecord = {
  id: number;
  title?: string | null;
  description?: string | null;
  hasButton?: boolean | null;
  buttonText?: string | null;
  buttonUrl?: string | null;
  startDatetime: string;
  endDatetime: string;
  isPublish?: boolean | null;
  products?: any[];
  variants?: any[];
};

export type VariantRow = {
  variantId: number;
  productId: number;
  productName: string;
  sku: string | null;
  image?: string | null;
  label: string;
  basePrice: number;
  baseStock: number;
  flashPrice: number;
  flashPercent: number | null;
  flashStock: number;
  isActive: boolean;
};

export type ProductGroupRow = {
  key: string;
  productId: number;
  productName: string;
  image?: string | null;
  totalVariants: number;
  variants: VariantRow[];
};

export type FormValues = {
  title?: string;
  description?: string;
  has_button?: boolean;
  button_text?: string | null;
  button_url?: string | null;
  start_datetime: Dayjs;
  end_datetime: Dayjs;
  is_publish?: boolean;
};
