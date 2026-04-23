import { axiosClient } from '@/config/axios';
import type { AdonisPaginatedPayload, ServeWrapper } from '@/lib/api-types';
import type { B1g1, B1g1ListQuery, B1g1Payload } from '../types';
import { normalizeB1g1 } from '../utils/normalize';

const B1G1_ENDPOINTS = {
  list: '/admin/buy-one-get-one',
  detail: (id: number | string) => `/admin/buy-one-get-one/${id}`,
} as const;

function buildListParams(filters: B1g1ListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  params.set('page', String(filters.page));
  params.set('per_page', String(filters.perPage));
  return params;
}

export const b1g1Service = {
  async list(filters: B1g1ListQuery): Promise<AdonisPaginatedPayload<B1g1>> {
    const params = buildListParams(filters);
    const response = await axiosClient.get<
      ServeWrapper<AdonisPaginatedPayload<unknown>>
    >(`${B1G1_ENDPOINTS.list}?${params.toString()}`);
    const payload = response.data.serve;
    return {
      ...payload,
      data: (payload.data ?? []).map(normalizeB1g1),
    };
  },

  async create(payload: B1g1Payload): Promise<B1g1> {
    const response = await axiosClient.post<ServeWrapper<unknown>>(
      B1G1_ENDPOINTS.list,
      payload,
    );
    return normalizeB1g1(response.data.serve);
  },

  async update(id: number | string, payload: B1g1Payload): Promise<B1g1> {
    const response = await axiosClient.put<ServeWrapper<unknown>>(
      B1G1_ENDPOINTS.detail(id),
      payload,
    );
    return normalizeB1g1(response.data.serve);
  },

  async remove(id: number | string): Promise<void> {
    await axiosClient.delete(B1G1_ENDPOINTS.detail(id));
  },
};
