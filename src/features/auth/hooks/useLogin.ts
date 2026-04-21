import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { authService } from '../services';
import type { LoginRequest, LoginResponse } from '../types';

export const useLogin = () => {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation<LoginResponse, Error, LoginRequest>({
    mutationFn: (payload) => authService.login(payload),
    onSuccess: (data) => {
      setSession({
        token: data.token,
        user: data.user,
        permissions: data.permissions,
        menuAccess: data.menuAccess,
      });
    },
  });
};
