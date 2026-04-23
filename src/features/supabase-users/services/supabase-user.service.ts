import { axiosClient } from '@/config/axios';
import type { AdonisPaginatedPayload, ServeWrapper } from '@/lib/api-types';
import type { SupabaseUser, SupabaseUserSummary, SupabaseUserListQuery } from '../types';
import {
  normalizeSupabaseUser,
  normalizeSupabaseUserSummary,
} from '../utils/normalize';

const EP = {
  list: '/admin/total-user-list',
  summary: '/admin/total-user-summary',
} as const;

function buildParams(filters: SupabaseUserListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.sortBy) params.set('sort_by', filters.sortBy);
  if (filters.sortOrder) params.set('sort_order', filters.sortOrder);
  if (filters.dateFrom) params.set('date_from', filters.dateFrom);
  if (filters.dateTo) params.set('date_to', filters.dateTo);
  if (filters.minLtv != null) params.set('min_ltv', String(filters.minLtv));
  if (filters.minOrders != null) params.set('min_orders', String(filters.minOrders));
  params.set('page', String(filters.page));
  params.set('per_page', String(filters.perPage));
  return params;
}

export const supabaseUserService = {
  async list(filters: SupabaseUserListQuery): Promise<AdonisPaginatedPayload<SupabaseUser>> {
    const params = buildParams(filters);
    const response = await axiosClient.get<ServeWrapper<AdonisPaginatedPayload<unknown>>>(
      `${EP.list}?${params.toString()}`,
    );
    const payload = response.data.serve;
    return {
      ...payload,
      data: (payload.data ?? []).map(normalizeSupabaseUser),
    };
  },

  async summary(filters: SupabaseUserListQuery): Promise<SupabaseUserSummary> {
    const params = buildParams(filters);
    const response = await axiosClient.get<ServeWrapper<unknown>>(
      `${EP.summary}?${params.toString()}`,
    );
    return normalizeSupabaseUserSummary(response.data.serve);
  },
};
