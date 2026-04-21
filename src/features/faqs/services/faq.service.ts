import { axiosClient } from '@/config/axios';
import type { AdonisPaginatedPayload } from '@/features/products/types';
import type { Faq, FaqListQuery, FaqPayload } from '../types';
import { normalizeFaq } from '../utils/normalize';

const FAQ_ENDPOINTS = {
  list: '/admin/faq',
  detail: (id: number | string) => `/admin/faq/${id}`,
} as const;

interface ServeWrapper<T> {
  message?: string;
  serve: T;
}

function buildListParams(filters: FaqListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.name) params.set('name', filters.name);
  params.set('page', String(filters.page));
  params.set('per_page', String(filters.perPage));
  return params;
}

export const faqService = {
  async list(filters: FaqListQuery): Promise<AdonisPaginatedPayload<Faq>> {
    const params = buildListParams(filters);
    const response = await axiosClient.get<
      ServeWrapper<AdonisPaginatedPayload<unknown>>
    >(`${FAQ_ENDPOINTS.list}?${params.toString()}`);
    const payload = response.data.serve;
    return {
      ...payload,
      data: (payload.data ?? []).map(normalizeFaq),
    };
  },

  async create(payload: FaqPayload): Promise<Faq> {
    const response = await axiosClient.post<ServeWrapper<unknown>>(
      FAQ_ENDPOINTS.list,
      payload,
    );
    return normalizeFaq(response.data.serve);
  },

  async update(id: number | string, payload: FaqPayload): Promise<Faq> {
    const response = await axiosClient.put<ServeWrapper<unknown>>(
      FAQ_ENDPOINTS.detail(id),
      payload,
    );
    return normalizeFaq(response.data.serve);
  },

  async remove(id: number | string): Promise<void> {
    await axiosClient.delete(FAQ_ENDPOINTS.detail(id));
  },
};
