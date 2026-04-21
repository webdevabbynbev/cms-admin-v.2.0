import { axiosClient } from '@/config/axios';
import type { AdonisPaginatedPayload } from '@/features/products/types';
import { toPaginated, type MetaPaginatedResponse } from '@/lib/meta-pagination';
import type { GiftListQuery, GiftPayload, GiftProduct } from '../types';
import { normalizeGiftProduct } from '../utils/normalize';

const GIFT_ENDPOINTS = {
  list: '/admin/gift-products',
  detail: (id: number | string) => `/admin/gift-products/${id}`,
} as const;

function buildListParams(filters: GiftListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  params.set('page', String(filters.page));
  params.set('per_page', String(filters.perPage));
  return params;
}

export const giftService = {
  async list(
    filters: GiftListQuery,
  ): Promise<AdonisPaginatedPayload<GiftProduct>> {
    const params = buildListParams(filters);
    const response = await axiosClient.get<MetaPaginatedResponse<unknown>>(
      `${GIFT_ENDPOINTS.list}?${params.toString()}`,
    );
    const paginated = toPaginated(response.data);
    return {
      ...paginated,
      data: paginated.data.map(normalizeGiftProduct),
    };
  },

  async create(payload: GiftPayload): Promise<GiftProduct> {
    const response = await axiosClient.post<unknown>(
      GIFT_ENDPOINTS.list,
      payload,
    );
    return normalizeGiftProduct(response.data);
  },

  async update(
    id: number | string,
    payload: GiftPayload,
  ): Promise<GiftProduct> {
    const response = await axiosClient.put<unknown>(
      GIFT_ENDPOINTS.detail(id),
      payload,
    );
    return normalizeGiftProduct(response.data);
  },

  async remove(id: number | string): Promise<void> {
    await axiosClient.delete(GIFT_ENDPOINTS.detail(id));
  },
};
