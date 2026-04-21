import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys.constant';
import { referralCodeService } from '../services';
import type { ReferralCodeListQuery, ReferralCodePayload } from '../types';

export const useReferralCodes = (filters: ReferralCodeListQuery) =>
  useQuery({
    queryKey: QUERY_KEYS.referralCodes.list(filters),
    queryFn: () => referralCodeService.list(filters),
    placeholderData: keepPreviousData,
  });

export const useCreateReferralCode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReferralCodePayload) =>
      referralCodeService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.referralCodes.root });
    },
  });
};

export const useUpdateReferralCode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: ReferralCodePayload;
    }) => referralCodeService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.referralCodes.root });
    },
  });
};

export const useDeleteReferralCode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => referralCodeService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.referralCodes.root });
    },
  });
};
