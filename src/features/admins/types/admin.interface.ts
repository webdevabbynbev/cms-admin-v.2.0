import type { AdminRole } from './admin.enum';

export interface Admin {
  id: number;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: AdminRole | null;
  roleName: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AdminListQuery {
  q?: string;
  role?: AdminRole;
  page: number;
  perPage: number;
}

export interface AdminCreatePayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: AdminRole;
  isActive: 0 | 1;
  permissions: Record<string, true>;
}

export interface AdminUpdatePayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string | null;
  role: AdminRole;
  isActive: 0 | 1;
  permissions: Record<string, true>;
}
