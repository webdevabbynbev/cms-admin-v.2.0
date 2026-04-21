import { axiosClient } from '@/config/axios';
import type { AdonisPaginatedPayload } from '@/features/products/types';
import type { AbandonedCart, AbandonedCartListQuery } from '../types';
import { normalizeAbandonedCart } from '../utils/normalize';

const EP = {
  list: '/admin/user-carts',
} as const;

interface ServeWrapper<T> {
  message?: string;
  serve: T;
}

function buildParams(filters: AbandonedCartListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  params.set('page', String(filters.page));
  params.set('per_page', String(filters.perPage));
  return params;
}

export const abandonedCartService = {
  async list(
    filters: AbandonedCartListQuery,
  ): Promise<AdonisPaginatedPayload<AbandonedCart>> {
    const params = buildParams(filters);
    const response = await axiosClient.get<
      ServeWrapper<AdonisPaginatedPayload<unknown>>
    >(`${EP.list}?${params.toString()}`);
    const payload = response.data.serve;
    return {
      ...payload,
      data: (payload.data ?? []).map(normalizeAbandonedCart),
    };
  },
};
