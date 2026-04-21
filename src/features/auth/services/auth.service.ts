import { axiosClient } from '@/config/axios';
import type {
  AuthPermissions,
  AuthUser,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  MenuAccess,
} from '../types';

const AUTH_ENDPOINTS = {
  login: '/auth/login-admin',
  forgot: '/auth/forgot',
  changePassword: '/profile/password',
} as const;

interface LoginApiResponse {
  message: string;
  serve: {
    data: AuthUser;
    token: string;
    permissions: AuthPermissions | null;
    menu_access: MenuAccess;
  } | null;
}

export const authService = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const response = await axiosClient.post<LoginApiResponse>(
      AUTH_ENDPOINTS.login,
      payload,
    );

    const serve = response.data.serve;
    if (!serve?.token || !serve?.data) {
      throw new Error('Invalid login response from server');
    }

    return {
      token: serve.token,
      user: serve.data,
      permissions: serve.permissions,
      menuAccess: serve.menu_access ?? {},
    };
  },

  async forgotPassword(payload: ForgotPasswordRequest): Promise<void> {
    await axiosClient.post(AUTH_ENDPOINTS.forgot, payload);
  },

  async changePassword(payload: ChangePasswordRequest): Promise<void> {
    await axiosClient.put(AUTH_ENDPOINTS.changePassword, payload);
  },
};
