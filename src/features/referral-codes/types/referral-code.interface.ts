export interface ReferralCode {
  id: number;
  code: string;
  discountPercent: number;
  maxUsesTotal: number;
  usedCount: number;
  isActive: boolean;
  startedAt: string | null;
  expiredAt: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ReferralCodeListQuery {
  q?: string;
  page: number;
  perPage: number;
}

export interface ReferralCodePayload {
  code: string;
  discount_percent: number;
  max_uses_total: number;
  is_active: boolean;
  started_at: string | null;
  expired_at: string | null;
}
