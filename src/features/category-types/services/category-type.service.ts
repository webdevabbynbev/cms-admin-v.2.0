import { axiosClient } from '@/config/axios';
import type { AdonisPaginatedPayload, ServeWrapper } from '@/lib/api-types';
import type {
  CategoryType,
  CategoryTypeListQuery,
  CategoryTypePayload,
} from '../types';
import { normalizeCategoryType } from '../utils/normalize';

const CATEGORY_TYPE_ENDPOINTS = {
  list: '/admin/category-types',
  flat: '/admin/category-types/list',
  detail: (slug: string) =>
    `/admin/category-types/${encodeURIComponent(slug)}`,
} as const;

function buildListParams(filters: CategoryTypeListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  params.set('page', String(filters.page));
  params.set('per_page', String(filters.perPage));
  return params;
}

export const categoryTypeService = {
  async list(
    filters: CategoryTypeListQuery,
  ): Promise<AdonisPaginatedPayload<CategoryType>> {
    const params = buildListParams(filters);
    const response = await axiosClient.get<
      ServeWrapper<AdonisPaginatedPayload<unknown>>
    >(`${CATEGORY_TYPE_ENDPOINTS.list}?${params.toString()}`);
    const payload = response.data.serve;
    return {
      ...payload,
      data: (payload.data ?? []).map(normalizeCategoryType),
    };
  },

  async flatAll(): Promise<CategoryType[]> {
    const response = await axiosClient.get<ServeWrapper<unknown[]>>(
      CATEGORY_TYPE_ENDPOINTS.flat,
    );
    const serve = response.data.serve;
    return Array.isArray(serve) ? serve.map(normalizeCategoryType) : [];
  },

  async create(payload: CategoryTypePayload): Promise<CategoryType> {
    const response = await axiosClient.post<ServeWrapper<unknown>>(
      CATEGORY_TYPE_ENDPOINTS.list,
      payload,
    );
    return normalizeCategoryType(response.data.serve);
  },

  async update(
    slug: string,
    payload: CategoryTypePayload,
  ): Promise<CategoryType> {
    const response = await axiosClient.put<ServeWrapper<unknown>>(
      CATEGORY_TYPE_ENDPOINTS.detail(slug),
      payload,
    );
    return normalizeCategoryType(response.data.serve);
  },

  async remove(slug: string): Promise<void> {
    await axiosClient.delete(CATEGORY_TYPE_ENDPOINTS.detail(slug));
  },
};
