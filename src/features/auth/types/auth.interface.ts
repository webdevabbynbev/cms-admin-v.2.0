import type { UserRole } from './auth.enum';

export interface AuthUser {
  id: number;
  firstName?: string;
  lastName?: string;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  role_name: string;
  isActive?: boolean;
  photoProfile?: string | null;
  photo_profile_url?: string;
  crmTier?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthPermissions {
  can_manage_products: boolean;
  can_manage_stock: boolean;
  can_approve_transfers: boolean;
  can_view_analytics: boolean;
  can_manage_users: boolean;
  can_manage_finance: boolean;
  can_access_pos: boolean;
  is_admin: boolean;
  is_gudang: boolean;
  is_finance: boolean;
  is_media: boolean;
  is_cashier_gudang: boolean;
  is_cashier: boolean;
}

export type MenuAccess = Record<string, boolean>;

export interface AuthSession {
  token: string;
  user: AuthUser;
  permissions: AuthPermissions | null;
  menuAccess: MenuAccess;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
  permissions: AuthPermissions | null;
  menuAccess: MenuAccess;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface LoginApiResponse {
  message: string;
  serve: {
    data: AuthUser;
    token: string;
    permissions: AuthPermissions | null;
    menu_access: MenuAccess;
  } | null;
}
