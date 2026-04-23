export type PicksType = 'abby' | 'bev' | 'top';

export interface PickProduct {
  id: number;
  name: string;
  masterSku: string | null;
  imageUrl: string | null;
  brandName: string | null;
  categoryTypeName: string | null;
  totalStock: number;
}

export interface PickRecord {
  id: number;
  order: number;
  isActive: boolean;
  productId: number;
  startDate: string | null;
  endDate: string | null;
  product: PickProduct | null;
}

export interface PickListQuery {
  q?: string;
  page: number;
  perPage: number;
}

export interface PickPayload {
  product_id: number;
  order: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
}

export interface PickUpdatePayload {
  order: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
}

export interface PickReorderPayload {
  updates: Array<{ id: number; order: number }>;
}
