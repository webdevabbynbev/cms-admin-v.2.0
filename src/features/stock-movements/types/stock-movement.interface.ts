export interface StockMovement {
  id: number;
  change: number;
  type: string;
  note: string | null;
  variant: {
    id: number | null;
    sku: string | null;
    barcode: string | null;
    productName: string | null;
  } | null;
  createdAt: string | null;
}

export interface StockMovementListQuery {
  q?: string;
  type?: string;
  page: number;
  perPage: number;
}

export interface StockAdjustmentPayload {
  variant_id: number;
  change: number;
  note: string;
}
