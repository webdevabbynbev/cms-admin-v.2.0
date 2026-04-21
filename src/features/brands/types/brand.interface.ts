export interface Brand {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  country: string | null;
  website: string | null;
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface BrandListQuery {
  q?: string;
  page: number;
  perPage: number;
}

export interface BrandPayload {
  name: string;
  description: string | null;
  country: string | null;
  website: string | null;
  isActive: 0 | 1;
}
