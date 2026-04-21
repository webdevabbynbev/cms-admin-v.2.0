export interface B1g1 {
  id: number;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  isEcommerce: boolean;
  isPos: boolean;
  applyTo: string;
  brandId: number | null;
  usageLimit: number | null;
  minimumPurchase: number | null;
  startedAt: string | null;
  expiredAt: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface B1g1ListQuery {
  q?: string;
  page: number;
  perPage: number;
}

export interface B1g1Payload {
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  is_ecommerce: boolean;
  is_pos: boolean;
  apply_to: string;
  brand_id: number | null;
  usage_limit: number | null;
  minimum_purchase: number | null;
  started_at: string | null;
  expired_at: string | null;
}
