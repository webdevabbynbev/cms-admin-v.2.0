export interface AbandonedCartItem {
  id: number;
  productName: string;
  qty: number;
  attributes: string | null;
  price: number;
  imageUrl: string | null;
}

export interface AbandonedCart {
  id: number;
  userId: number | null;
  name: string;
  email: string;
  phoneNumber: string | null;
  items: AbandonedCartItem[];
  abandonedValue: number;
  totalOrders: number;
  ltv: number;
  recoveryRate: number;
  lastActivity: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AbandonedCartListQuery {
  q?: string;
  page: number;
  perPage: number;
}
