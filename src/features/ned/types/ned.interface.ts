export interface Ned {
  id: number;
  name: string;
  description: string | null;
  sku: string | null;
  price: number | null;
  quantity: number | null;
  isActive: boolean;
  isVisibleEcommerce: boolean;
  isVisiblePos: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface NedListQuery {
  q?: string;
  page: number;
  perPage: number;
}

export interface NedPayload {
  name: string;
  description: string | null;
  sku: string | null;
  price: number | null;
  quantity: number | null;
  is_active: boolean;
  is_visible_ecommerce: boolean;
  is_visible_pos: boolean;
}
