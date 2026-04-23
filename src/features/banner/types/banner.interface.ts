import type { BannerPosition, BannerType } from './banner.enum';

export interface Banner {
  id: number;
  title: string;
  description: string | null;
  position: BannerPosition | null;
  bannerType: BannerType | null;
  hasButton: boolean | null;
  buttonText: string | null;
  buttonUrl: string | null;
  image: string | null;
  imageMobile: string | null;
  order: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface BannerListQuery {
  name?: string;
  page: number;
  perPage: number;
}

export interface BannerReorderPayload {
  updates: Array<{ id: number; order: number }>;
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
