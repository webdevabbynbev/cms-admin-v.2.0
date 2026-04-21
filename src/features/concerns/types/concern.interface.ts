export interface Concern {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  position: number;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ConcernOption {
  id: number;
  concernId: number;
  name: string;
  slug: string;
  description: string | null;
  position: number;
  concern?: { id: number; name: string; slug: string } | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ConcernListQuery {
  q?: string;
  page: number;
  perPage: number;
}

export interface ConcernOptionListQuery extends ConcernListQuery {
  concernId?: number;
}

export interface ConcernPayload {
  name: string;
  description: string | null;
  position?: number;
}

export interface ConcernOptionPayload {
  concernId: number;
  name: string;
  description: string | null;
  position?: number;
}
