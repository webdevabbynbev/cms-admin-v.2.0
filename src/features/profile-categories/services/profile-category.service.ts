import { axiosClient } from '@/config/axios';
import type { AdonisPaginatedPayload, ServeWrapper } from '@/lib/api-types';
import type {
  ProfileCategory,
  ProfileCategoryListQuery,
  ProfileCategoryOption,
  ProfileCategoryOptionListQuery,
  ProfileCategoryOptionPayload,
  ProfileCategoryPayload,
} from '../types';
import {
  normalizeProfileCategory,
  normalizeProfileCategoryOption,
} from '../utils/normalize';

const PROFILE_CATEGORY_ENDPOINTS = {
  list: '/admin/profile-categories',
  detail: (id: number | string) => `/admin/profile-categories/${id}`,
  optionList: '/admin/profile-category-options',
  optionDetail: (id: number | string) => `/admin/profile-category-options/${id}`,
} as const;

function buildCategoryParams(
  filters: ProfileCategoryListQuery,
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  params.set('page', String(filters.page));
  params.set('per_page', String(filters.perPage));
  return params;
}

function buildOptionParams(
  filters: ProfileCategoryOptionListQuery,
): URLSearchParams {
  const params = buildCategoryParams(filters);
  if (filters.categoryId != null) {
    params.set('category_id', String(filters.categoryId));
  }
  return params;
}

export const profileCategoryService = {
  async listCategories(
    filters: ProfileCategoryListQuery,
  ): Promise<AdonisPaginatedPayload<ProfileCategory>> {
    const params = buildCategoryParams(filters);
    const response = await axiosClient.get<
      ServeWrapper<AdonisPaginatedPayload<unknown>>
    >(`${PROFILE_CATEGORY_ENDPOINTS.list}?${params.toString()}`);
    const payload = response.data.serve;
    return {
      ...payload,
      data: (payload.data ?? []).map(normalizeProfileCategory),
    };
  },

  async createCategory(
    payload: ProfileCategoryPayload,
  ): Promise<ProfileCategory> {
    const response = await axiosClient.post<ServeWrapper<unknown>>(
      PROFILE_CATEGORY_ENDPOINTS.list,
      payload,
    );
    return normalizeProfileCategory(response.data.serve);
  },

  async updateCategory(
    id: number | string,
    payload: ProfileCategoryPayload,
  ): Promise<ProfileCategory> {
    const response = await axiosClient.put<ServeWrapper<unknown>>(
      PROFILE_CATEGORY_ENDPOINTS.detail(id),
      payload,
    );
    return normalizeProfileCategory(response.data.serve);
  },

  async removeCategory(id: number | string): Promise<void> {
    await axiosClient.delete(PROFILE_CATEGORY_ENDPOINTS.detail(id));
  },

  async listOptions(
    filters: ProfileCategoryOptionListQuery,
  ): Promise<AdonisPaginatedPayload<ProfileCategoryOption>> {
    const params = buildOptionParams(filters);
    const response = await axiosClient.get<
      ServeWrapper<AdonisPaginatedPayload<unknown>>
    >(`${PROFILE_CATEGORY_ENDPOINTS.optionList}?${params.toString()}`);
    const payload = response.data.serve;
    return {
      ...payload,
      data: (payload.data ?? []).map(normalizeProfileCategoryOption),
    };
  },

  async createOption(
    payload: ProfileCategoryOptionPayload,
  ): Promise<ProfileCategoryOption> {
    const response = await axiosClient.post<ServeWrapper<unknown>>(
      PROFILE_CATEGORY_ENDPOINTS.optionList,
      payload,
    );
    return normalizeProfileCategoryOption(response.data.serve);
  },

  async updateOption(
    id: number | string,
    payload: ProfileCategoryOptionPayload,
  ): Promise<ProfileCategoryOption> {
    const response = await axiosClient.put<ServeWrapper<unknown>>(
      PROFILE_CATEGORY_ENDPOINTS.optionDetail(id),
      payload,
    );
    return normalizeProfileCategoryOption(response.data.serve);
  },

  async removeOption(id: number | string): Promise<void> {
    await axiosClient.delete(PROFILE_CATEGORY_ENDPOINTS.optionDetail(id));
  },
};
