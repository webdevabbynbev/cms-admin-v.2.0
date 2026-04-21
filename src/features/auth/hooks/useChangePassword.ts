import { useMutation } from '@tanstack/react-query';
import { authService } from '../services';
import type { ChangePasswordRequest } from '../types';

export const useChangePassword = () => {
  return useMutation<void, Error, ChangePasswordRequest>({
    mutationFn: (payload) => authService.changePassword(payload),
  });
};
