import { axiosClient } from '@/config/axios';
import type { AdonisPaginatedPayload, ServeWrapper } from '@/lib/api-types';
import { toPaginated, type MetaPaginatedResponse } from '@/lib/meta-pagination';
import type {
  PickRecord,
  PickListQuery,
  PickPayload,
  PickReorderPayload,
  PickUpdatePayload,
} from '../types';
import { normalizePickRecord } from '../utils/normalize';

function buildParams(filters: PickListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  params.set('page', String(filters.page));
  params.set('per_page', String(filters.perPage));
  return params;
}

export const picksService = {
  async list(
    endpoint: string,
    filters: PickListQuery,
  ): Promise<AdonisPaginatedPayload<PickRecord>> {
    const params = buildParams(filters);
    const response = await axiosClient.get<MetaPaginatedResponse<unknown>>(
      `${endpoint}?${params.toString()}`,
    );
    return {
      ...toPaginated(response.data),
      data: response.data.data.map(normalizePickRecord),
    };
  },

  async create(endpoint: string, payload: PickPayload): Promise<PickRecord> {
    const response = await axiosClient.post<ServeWrapper<unknown>>(endpoint, payload);
    return normalizePickRecord(response.data.serve);
  },

  async update(
    endpoint: string,
    id: number,
    payload: PickUpdatePayload,
  ): Promise<PickRecord> {
    const response = await axiosClient.put<ServeWrapper<unknown>>(
      `${endpoint}/${id}`,
      payload,
    );
    return normalizePickRecord(response.data.serve);
  },

  async remove(endpoint: string, id: number): Promise<void> {
    await axiosClient.delete(`${endpoint}/${id}`);
  },

  async reorder(endpoint: string, payload: PickReorderPayload): Promise<void> {
    await axiosClient.post(`${endpoint}/update-order`, payload);
  },
};
