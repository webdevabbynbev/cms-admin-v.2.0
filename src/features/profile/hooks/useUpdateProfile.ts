import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { profileService } from '../services';
import type { UpdateProfilePayload } from '../types';

export const useUpdateProfile = () => {
  const setSession = useAuthStore((s) => s.setSession);
  const token = useAuthStore((s) => s.token);
  const permissions = useAuthStore((s) => s.permissions);
  const menuAccess = useAuthStore((s) => s.menuAccess);

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => profileService.update(payload),
    onSuccess: (user) => {
      if (!token) return;
      setSession({ token, user, permissions, menuAccess });
    },
  });
};
