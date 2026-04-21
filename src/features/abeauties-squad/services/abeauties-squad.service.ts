import { axiosClient } from '@/config/axios';
import type { AdonisPaginatedPayload } from '@/features/products/types';
import type {
  AbeautiesSquadListQuery,
  AbeautiesSquadMember,
  AbeautiesSquadStatusPayload,
} from '../types';
import { normalizeSquadMember } from '../utils/normalize';

const EP = {
  list: '/admin/abeauty-squad',
  status: (id: number | string) => `/admin/abeauty-squad/${id}/status`,
} as const;

interface ServeWrapper<T> {
  message?: string;
  serve: T;
}

function buildParams(filters: AbeautiesSquadListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.name) params.set('name', filters.name);
  params.set('page', String(filters.page));
  params.set('per_page', String(filters.perPage));
  return params;
}

export const abeautiesSquadService = {
  async list(
    filters: AbeautiesSquadListQuery,
  ): Promise<AdonisPaginatedPayload<AbeautiesSquadMember>> {
    const params = buildParams(filters);
    const response = await axiosClient.get<
      ServeWrapper<AdonisPaginatedPayload<unknown>>
    >(`${EP.list}?${params.toString()}`);
    const payload = response.data.serve;
    return {
      ...payload,
      data: (payload.data ?? []).map(normalizeSquadMember),
    };
  },

  async updateStatus(
    id: number | string,
    payload: AbeautiesSquadStatusPayload,
  ): Promise<void> {
    await axiosClient.patch(EP.status(id), payload);
  },
};
