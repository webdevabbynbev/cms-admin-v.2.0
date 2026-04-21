export interface Tag {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface TagListQuery {
  q?: string;
  page: number;
  perPage: number;
}

export interface TagPayload {
  name: string;
  description?: string | null;
}
