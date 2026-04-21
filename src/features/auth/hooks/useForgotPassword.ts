import { useMutation } from '@tanstack/react-query';
import { authService } from '../services';
import type { ForgotPasswordRequest } from '../types';

export const useForgotPassword = () => {
  return useMutation<void, Error, ForgotPasswordRequest>({
    mutationFn: (payload) => authService.forgotPassword(payload),
  });
};
