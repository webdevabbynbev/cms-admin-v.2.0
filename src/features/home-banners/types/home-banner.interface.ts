export interface HomeBannerSection {
  id: number;
  name: string;
  slug: string;
  order: number;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface HomeBannerSectionListQuery {
  q?: string;
  page: number;
  perPage: number;
}

export interface HomeBannerSectionPayload {
  name: string;
  order?: number;
}
