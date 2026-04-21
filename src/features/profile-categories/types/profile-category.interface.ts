export interface ProfileCategory {
  id: number;
  name: string;
  type: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ProfileCategoryOption {
  id: number;
  profileCategoriesId: number;
  label: string;
  value: string;
  isActive: boolean;
  category: { id: number; name: string } | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ProfileCategoryListQuery {
  q?: string;
  page: number;
  perPage: number;
}

export interface ProfileCategoryOptionListQuery extends ProfileCategoryListQuery {
  categoryId?: number;
}

export interface ProfileCategoryPayload {
  name: string;
  type: string | null;
}

export interface ProfileCategoryOptionPayload {
  profileCategoriesId: number;
  label: string;
  value: string;
  isActive: boolean;
}
