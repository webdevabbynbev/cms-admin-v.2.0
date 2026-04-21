import { useAuthStore } from '@/stores/auth.store';

export const useAuth = () => {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const permissions = useAuthStore((state) => state.permissions);
  const menuAccess = useAuthStore((state) => state.menuAccess);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const clearSession = useAuthStore((state) => state.clearSession);

  return {
    user,
    token,
    permissions,
    menuAccess,
    isAuthenticated,
    logout: clearSession,
  };
};
