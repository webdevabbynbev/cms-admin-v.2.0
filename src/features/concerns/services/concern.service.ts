import { axiosClient } from '@/config/axios';
import type { AdonisPaginatedPayload, ServeWrapper } from '@/lib/api-types';
import type {
  Concern,
  ConcernListQuery,
  ConcernOption,
  ConcernOptionListQuery,
  ConcernOptionPayload,
  ConcernPayload,
} from '../types';
import { normalizeConcern, normalizeConcernOption } from '../utils/normalize';

const CONCERN_ENDPOINTS = {
  list: '/admin/concern',
  detail: (slug: string) => `/admin/concern/${encodeURIComponent(slug)}`,
  optionList: '/admin/concern-options',
  optionDetail: (slug: string) =>
    `/admin/concern-options/${encodeURIComponent(slug)}`,
} as const;

function buildConcernParams(filters: ConcernListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  params.set('page', String(filters.page));
  params.set('per_page', String(filters.perPage));
  return params;
}

function buildOptionParams(filters: ConcernOptionListQuery): URLSearchParams {
  const params = buildConcernParams(filters);
  if (filters.concernId != null) {
    params.set('concern_id', String(filters.concernId));
  }
  return params;
}

export const concernService = {
  async listConcerns(
    filters: ConcernListQuery,
  ): Promise<AdonisPaginatedPayload<Concern>> {
    const params = buildConcernParams(filters);
    const response = await axiosClient.get<
      ServeWrapper<AdonisPaginatedPayload<unknown>>
    >(`${CONCERN_ENDPOINTS.list}?${params.toString()}`);
    const payload = response.data.serve;
    return {
      ...payload,
      data: (payload.data ?? []).map(normalizeConcern),
    };
  },

  async createConcern(payload: ConcernPayload): Promise<Concern> {
    const response = await axiosClient.post<ServeWrapper<unknown>>(
      CONCERN_ENDPOINTS.list,
      payload,
    );
    return normalizeConcern(response.data.serve);
  },

  async updateConcern(slug: string, payload: ConcernPayload): Promise<Concern> {
    const response = await axiosClient.put<ServeWrapper<unknown>>(
      CONCERN_ENDPOINTS.detail(slug),
      payload,
    );
    return normalizeConcern(response.data.serve);
  },

  async removeConcern(slug: string): Promise<void> {
    await axiosClient.delete(CONCERN_ENDPOINTS.detail(slug));
  },

  async listOptions(
    filters: ConcernOptionListQuery,
  ): Promise<AdonisPaginatedPayload<ConcernOption>> {
    const params = buildOptionParams(filters);
    const response = await axiosClient.get<
      ServeWrapper<AdonisPaginatedPayload<unknown>>
    >(`${CONCERN_ENDPOINTS.optionList}?${params.toString()}`);
    const payload = response.data.serve;
    return {
      ...payload,
      data: (payload.data ?? []).map(normalizeConcernOption),
    };
  },

  async createOption(payload: ConcernOptionPayload): Promise<ConcernOption> {
    const body = {
      concern_id: payload.concernId,
      name: payload.name,
      description: payload.description,
      position: payload.position,
    };
    const response = await axiosClient.post<ServeWrapper<unknown>>(
      CONCERN_ENDPOINTS.optionList,
      body,
    );
    return normalizeConcernOption(response.data.serve);
  },

  async updateOption(
    slug: string,
    payload: ConcernOptionPayload,
  ): Promise<ConcernOption> {
    const body = {
      concern_id: payload.concernId,
      name: payload.name,
      description: payload.description,
      position: payload.position,
    };
    const response = await axiosClient.put<ServeWrapper<unknown>>(
      CONCERN_ENDPOINTS.optionDetail(slug),
      body,
    );
    return normalizeConcernOption(response.data.serve);
  },

  async removeOption(slug: string): Promise<void> {
    await axiosClient.delete(CONCERN_ENDPOINTS.optionDetail(slug));
  },
};
