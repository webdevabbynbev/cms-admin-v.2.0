import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys.constant';
import { voucherService } from '../services';
import type {
  VoucherFormPayload,
  VoucherListQuery,
  VoucherStatusPayload,
  VoucherVisibilityPayload,
} from '../types';

export const useVouchers = (filters: VoucherListQuery) => {
  return useQuery({
    queryKey: QUERY_KEYS.vouchers.list(filters),
    queryFn: () => voucherService.list(filters),
    placeholderData: keepPreviousData,
  });
};

export const useCreateVoucher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: VoucherFormPayload) => voucherService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vouchers.root });
    },
  });
};

export const useUpdateVoucher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: VoucherFormPayload) => voucherService.update(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vouchers.root });
    },
  });
};

export const useDeleteVoucher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => voucherService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vouchers.root });
    },
  });
};

export const useToggleVoucherStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: VoucherStatusPayload) =>
      voucherService.updateStatus(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vouchers.root });
    },
  });
};

export const useToggleVoucherVisibility = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: VoucherVisibilityPayload) =>
      voucherService.updateVisibility(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vouchers.root });
    },
  });
};
