import type { FlashSaleRecord } from "../../../components/Forms/FlashSale/flashTypes";

export type FlashSaleRow = FlashSaleRecord & {
  is_active?: boolean | number;
  start_time?: string;
  end_time?: string;
  items?: any[];
};

export type FlashSaleItem = {
  __key?: string;
  id?: number | string | null;
  label?: string | null;
  sku?: string | null;
  image?: string | null;
  productId?: number | null;
  productName?: string | null;
  basePrice?: number;
  baseStock?: number;
  flashPrice?: number | null;
  promoStock?: number | null;
  pivotId?: number | null;
};

export type ProductGroupRow = {
  key: string;
  productId: number | null;
  productName: string;
  image?: string | null;
  totalVariants: number;
  variants: FlashSaleItem[];
  pivotId?: number | null;
};
