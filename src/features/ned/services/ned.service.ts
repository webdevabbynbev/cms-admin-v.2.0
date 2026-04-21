import { axiosClient } from '@/config/axios';
import type { AdonisPaginatedPayload } from '@/features/products/types';
import type { Ned, NedListQuery, NedPayload } from '../types';
import { normalizeNed } from '../utils/normalize';

const NED_ENDPOINTS = {
  list: '/admin/ned',
  detail: (id: number | string) => `/admin/ned/${id}`,
} as const;

interface ServeWrapper<T> {
  message?: string;
  serve: T;
}

function buildListParams(filters: NedListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  params.set('page', String(filters.page));
  params.set('per_page', String(filters.perPage));
  return params;
}

export const nedService = {
  async list(filters: NedListQuery): Promise<AdonisPaginatedPayload<Ned>> {
    const params = buildListParams(filters);
    const response = await axiosClient.get<
      ServeWrapper<AdonisPaginatedPayload<unknown>>
    >(`${NED_ENDPOINTS.list}?${params.toString()}`);
    const payload = response.data.serve;
    return {
      ...payload,
      data: (payload.data ?? []).map(normalizeNed),
    };
  },

  async create(payload: NedPayload): Promise<Ned> {
    const response = await axiosClient.post<ServeWrapper<unknown>>(
      NED_ENDPOINTS.list,
      payload,
    );
    return normalizeNed(response.data.serve);
  },

  async update(id: number | string, payload: NedPayload): Promise<Ned> {
    const response = await axiosClient.put<ServeWrapper<unknown>>(
      NED_ENDPOINTS.detail(id),
      payload,
    );
    return normalizeNed(response.data.serve);
  },

  async remove(id: number | string): Promise<void> {
    await axiosClient.delete(NED_ENDPOINTS.detail(id));
  },
};
