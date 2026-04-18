import type { Dayjs } from "dayjs";

export type SaleVariantInput = {
  variant_id: number;
  sale_price: number;
  stock: number;
};

export type SaleRecord = {
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
  label: string;
  variantName: string;
  image?: string | null;

  basePrice: number;
  baseStock: number; // Stok asli produk

  // Sale inputs
  salePrice: number;
  salePercent: number | null; // Helper untuk UI
  saleStock: number; // Jatah stok untuk sale

  isActive: boolean; // Apakah varian ini ikut sale
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
