export interface CategoryType {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  level: number;
  iconPublicId: string | null;
  iconUrl: string | null;
  productsCount: number;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CategoryTypeListQuery {
  q?: string;
  page: number;
  perPage: number;
}

export interface CategoryTypePayload {
  name: string;
  parentId: number | null;
  iconPublicId?: string | null;
}
