export type ReferralCodeRecord = {
  id: number | string;
  code?: string | null;
  discountPercent?: number | null;
  discount_percent?: number | null;
  usageCount?: number | string | null;
  usage_count?: number | string | null;
  remainingUsesTotal?: number | string | null;
  remaining_uses_total?: number | string | null;
  isActive?: boolean | number | null;
  is_active?: boolean | number | null;
  startedAt?: string | null;
  started_at?: string | null;
  expiredAt?: string | null;
  expired_at?: string | null;
  maxUsesTotal?: number | null;
  max_uses_total?: number | null;
  maxUsesPerUser?: number | null;
  max_uses_per_user?: number | null;
};

export type PaginatedResponse = {
  data?: ReferralCodeRecord[];
  meta?: {
    current_page?: number;
    per_page?: number;
    total?: number;
  };
  currentPage?: number;
  perPage?: number;
  total?: number;
};
