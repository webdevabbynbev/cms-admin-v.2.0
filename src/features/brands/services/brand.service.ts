import { axiosClient } from '@/config/axios';
import type { AdonisPaginatedPayload, ServeWrapper } from '@/lib/api-types';
import type { Brand, BrandListQuery, BrandPayload } from '../types';
import { normalizeBrand } from '../utils/normalize';

const BRAND_ENDPOINTS = {
  list: '/admin/brands',
  detail: (slug: string) => `/admin/brands/${encodeURIComponent(slug)}`,
  logo: (slug: string) => `/admin/brands/${encodeURIComponent(slug)}/logo`,
  banner: (slug: string) => `/admin/brands/${encodeURIComponent(slug)}/banner`,
} as const;

function buildListParams(filters: BrandListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  params.set('page', String(filters.page));
  params.set('per_page', String(filters.perPage));
  return params;
}

export const brandService = {
  async list(filters: BrandListQuery): Promise<AdonisPaginatedPayload<Brand>> {
    const params = buildListParams(filters);
    const response = await axiosClient.get<
      ServeWrapper<AdonisPaginatedPayload<unknown>>
    >(`${BRAND_ENDPOINTS.list}?${params.toString()}`);
    const payload = response.data.serve;
    return {
      ...payload,
      data: (payload.data ?? []).map(normalizeBrand),
    };
  },

  async create(payload: BrandPayload): Promise<Brand> {
    const response = await axiosClient.post<ServeWrapper<unknown>>(
      BRAND_ENDPOINTS.list,
      payload,
    );
    return normalizeBrand(response.data.serve);
  },

  async update(slug: string, payload: BrandPayload): Promise<Brand> {
    const response = await axiosClient.put<ServeWrapper<unknown>>(
      BRAND_ENDPOINTS.detail(slug),
      payload,
    );
    return normalizeBrand(response.data.serve);
  },

  async remove(slug: string): Promise<void> {
    await axiosClient.delete(BRAND_ENDPOINTS.detail(slug));
  },

  async uploadLogo(slug: string, file: File): Promise<Brand> {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await axiosClient.post<ServeWrapper<unknown>>(
      BRAND_ENDPOINTS.logo(slug),
      formData,
      { timeout: 0 },
    );
    return normalizeBrand(response.data.serve);
  },

  async uploadBanner(slug: string, file: File): Promise<Brand> {
    const formData = new FormData();
    formData.append('banner', file);
    const response = await axiosClient.post<ServeWrapper<unknown>>(
      BRAND_ENDPOINTS.banner(slug),
      formData,
      { timeout: 0 },
    );
    return normalizeBrand(response.data.serve);
  },
};
