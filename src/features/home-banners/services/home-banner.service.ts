import { axiosClient } from '@/config/axios';
import type { AdonisPaginatedPayload, ServeWrapper } from '@/lib/api-types';
import type {
  HomeBannerSection,
  HomeBannerSectionListQuery,
  HomeBannerSectionPayload,
  HomeBannerSectionReorderPayload,
} from '../types';
import { normalizeSection } from '../utils/normalize';

const EP = {
  sections: '/admin/home-banners/sections',
  sectionDetail: (id: number | string) => `/admin/home-banners/sections/${id}`,
  sectionsReorder: '/admin/home-banners/sections/update-order',
} as const;

function buildParams(filters: HomeBannerSectionListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  params.set('page', String(filters.page));
  params.set('per_page', String(filters.perPage));
  return params;
}

export const homeBannerService = {
  async listSections(
    filters: HomeBannerSectionListQuery,
  ): Promise<AdonisPaginatedPayload<HomeBannerSection>> {
    const params = buildParams(filters);
    const response = await axiosClient.get<
      ServeWrapper<AdonisPaginatedPayload<unknown>>
    >(`${EP.sections}?${params.toString()}`);
    const payload = response.data.serve;
    return {
      ...payload,
      data: (payload.data ?? []).map(normalizeSection),
    };
  },

  async createSection(
    payload: HomeBannerSectionPayload,
  ): Promise<HomeBannerSection> {
    const response = await axiosClient.post<ServeWrapper<unknown>>(
      EP.sections,
      payload,
    );
    return normalizeSection(response.data.serve);
  },

  async updateSection(
    id: number | string,
    payload: HomeBannerSectionPayload,
  ): Promise<HomeBannerSection> {
    const response = await axiosClient.put<ServeWrapper<unknown>>(
      EP.sectionDetail(id),
      payload,
    );
    return normalizeSection(response.data.serve);
  },

  async removeSection(id: number | string): Promise<void> {
    await axiosClient.delete(EP.sectionDetail(id));
  },

  async reorderSections(payload: HomeBannerSectionReorderPayload): Promise<void> {
    await axiosClient.post(EP.sectionsReorder, payload);
  },
};
