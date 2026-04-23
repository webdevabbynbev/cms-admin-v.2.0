import { axiosClient } from '@/config/axios';
import type { ServeWrapper } from '@/lib/api-types';
import type { ContentDocument, ContentPayload, ContentSlug } from '../types';

export const contentService = {
  async get(slug: ContentSlug): Promise<ContentDocument> {
    const response = await axiosClient.get<ServeWrapper<ContentDocument>>(
      `/admin/${slug}`,
    );
    return {
      value: String(response.data.serve?.value ?? ''),
    };
  },

  async update(
    slug: ContentSlug,
    payload: ContentPayload,
  ): Promise<ContentDocument> {
    const response = await axiosClient.post<ServeWrapper<ContentDocument>>(
      `/admin/${slug}`,
      payload,
    );
    return {
      value: String(response.data.serve?.value ?? ''),
    };
  },
};
