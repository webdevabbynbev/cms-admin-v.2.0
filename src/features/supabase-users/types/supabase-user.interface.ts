export interface SupabaseUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  name: string;
  phoneNumber: string | null;
  lastSignInAt: string | null;
  createdAt: string;
  emailVerified: number | null;
  roleName: string;
  totalOrders: number;
  ltv: number;
  photoProfileUrl: string | null;
}

export interface SupabaseUserSummary {
  totalUsers: number;
  totalTransactions: number;
  totalRevenue: number;
  averageLtv: number;
}

export interface SupabaseUserListQuery {
  q?: string;
  page: number;
  perPage: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  dateFrom?: string;
  dateTo?: string;
  minLtv?: number;
  minOrders?: number;
}
