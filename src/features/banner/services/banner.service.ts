import { axiosClient } from '@/config/axios';
import type { AdonisPaginatedPayload } from '@/features/products/types';
import type {
  Banner,
  BannerListQuery,
  BannerReorderPayload,
} from '../types';

const BANNER_ENDPOINTS = {
  list: '/admin/banners',
  detail: (id: number | string) => `/admin/banners/${id}`,
  reorder: '/admin/banners/update-order',
} as const;

interface NestedBannerResponse<T> {
  data: {
    serve: T;
  };
}

interface DirectBannerResponse<T> {
  message?: string;
  serve: T;
}

type RawBanner = Banner | { $attributes: Banner };

function normalizeBanner(raw: RawBanner): Banner {
  if (raw && typeof raw === 'object' && '$attributes' in raw) {
    return (raw as { $attributes: Banner }).$attributes;
  }
  return raw as Banner;
}

export interface BannerFormPayload {
  title: string;
  description: string;
  position: string;
  banner_type: string;
  has_button: boolean;
  button_text?: string;
  button_url?: string;
  image_file?: File | null;
  image_mobile_file?: File | null;
}

function toFormData(payload: BannerFormPayload): FormData {
  const fd = new FormData();
  fd.append('title', payload.title);
  fd.append('description', payload.description);
  fd.append('position', payload.position);
  fd.append('banner_type', payload.banner_type);
  fd.append('has_button', payload.has_button ? '1' : '0');

  if (payload.button_text) fd.append('button_text', payload.button_text);
  if (payload.button_url) fd.append('button_url', payload.button_url);

  if (payload.image_file) fd.append('image', payload.image_file);
  if (payload.image_mobile_file) fd.append('image_mobile', payload.image_mobile_file);

  return fd;
}

export const bannerService = {
  async list(filters: BannerListQuery): Promise<AdonisPaginatedPayload<Banner>> {
    const params = new URLSearchParams();
    if (filters.name) params.set('name', filters.name);
    params.set('page', String(filters.page));
    params.set('per_page', String(filters.perPage));
    const response = await axiosClient.get<
      NestedBannerResponse<AdonisPaginatedPayload<RawBanner>>
    >(`${BANNER_ENDPOINTS.list}?${params.toString()}`);
    const payload = response.data.data.serve;
    return {
      ...payload,
      data: payload.data.map(normalizeBanner),
    };
  },

  async getById(id: number | string): Promise<Banner> {
    const response = await axiosClient.get<DirectBannerResponse<RawBanner>>(
      BANNER_ENDPOINTS.detail(id),
    );
    return normalizeBanner(response.data.serve);
  },

  async create(payload: BannerFormPayload): Promise<Banner | null> {
    const response = await axiosClient.post<DirectBannerResponse<RawBanner>>(
      BANNER_ENDPOINTS.list,
      toFormData(payload),
    );
    return response.data.serve ? normalizeBanner(response.data.serve) : null;
  },

  async update(id: number | string, payload: BannerFormPayload): Promise<Banner | null> {
    const response = await axiosClient.put<DirectBannerResponse<RawBanner>>(
      BANNER_ENDPOINTS.detail(id),
      toFormData(payload),
    );
    return response.data.serve ? normalizeBanner(response.data.serve) : null;
  },

  async remove(id: number | string): Promise<void> {
    await axiosClient.delete(BANNER_ENDPOINTS.detail(id));
  },

  async reorder(payload: BannerReorderPayload): Promise<void> {
    await axiosClient.post(BANNER_ENDPOINTS.reorder, payload);
  },
};
