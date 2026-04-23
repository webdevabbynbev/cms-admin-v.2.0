import { axiosClient } from '@/config/axios';
import type { AdonisPaginatedPayload, ServeWrapper } from '@/lib/api-types';
import type { Tag, TagListQuery, TagPayload } from '../types';
import { normalizeTag } from '../utils/normalize';

const TAG_ENDPOINTS = {
  list: '/admin/tags',
  detail: (slug: string) => `/admin/tags/${encodeURIComponent(slug)}`,
} as const;

function buildListParams(filters: TagListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  params.set('page', String(filters.page));
  params.set('per_page', String(filters.perPage));
  return params;
}

export const tagService = {
  async list(filters: TagListQuery): Promise<AdonisPaginatedPayload<Tag>> {
    const params = buildListParams(filters);
    const response = await axiosClient.get<
      ServeWrapper<AdonisPaginatedPayload<unknown>>
    >(`${TAG_ENDPOINTS.list}?${params.toString()}`);
    const payload = response.data.serve;
    return {
      ...payload,
      data: (payload.data ?? []).map(normalizeTag),
    };
  },

  async create(payload: TagPayload): Promise<Tag> {
    const response = await axiosClient.post<ServeWrapper<unknown>>(
      TAG_ENDPOINTS.list,
      payload,
    );
    return normalizeTag(response.data.serve);
  },

  async update(slug: string, payload: TagPayload): Promise<Tag> {
    const response = await axiosClient.put<ServeWrapper<unknown>>(
      TAG_ENDPOINTS.detail(slug),
      payload,
    );
    return normalizeTag(response.data.serve);
  },

  async remove(slug: string): Promise<void> {
    await axiosClient.delete(TAG_ENDPOINTS.detail(slug));
  },
};
