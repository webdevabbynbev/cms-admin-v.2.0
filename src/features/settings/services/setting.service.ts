import { axiosClient } from '@/config/axios';
import type { AdonisPaginatedPayload, ServeWrapper } from '@/lib/api-types';
import type { Setting, SettingListQuery, SettingPayload } from '../types';
import { normalizeSetting } from '../utils/normalize';

const SETTING_ENDPOINTS = {
  list: '/admin/settings',
} as const;

function buildListParams(filters: SettingListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.name) params.set('name', filters.name);
  params.set('page', String(filters.page));
  params.set('per_page', String(filters.perPage));
  return params;
}

export const settingService = {
  async list(
    filters: SettingListQuery,
  ): Promise<AdonisPaginatedPayload<Setting>> {
    const params = buildListParams(filters);
    const response = await axiosClient.get<
      ServeWrapper<AdonisPaginatedPayload<unknown>>
    >(`${SETTING_ENDPOINTS.list}?${params.toString()}`);
    const payload = response.data.serve;
    return {
      ...payload,
      data: (payload.data ?? []).map(normalizeSetting),
    };
  },

  async create(payload: SettingPayload): Promise<Setting> {
    const response = await axiosClient.post<ServeWrapper<unknown>>(
      SETTING_ENDPOINTS.list,
      payload,
    );
    return normalizeSetting(response.data.serve);
  },

  async update(payload: SettingPayload): Promise<Setting> {
    const response = await axiosClient.put<ServeWrapper<unknown>>(
      SETTING_ENDPOINTS.list,
      payload,
    );
    return normalizeSetting(response.data.serve);
  },
};
