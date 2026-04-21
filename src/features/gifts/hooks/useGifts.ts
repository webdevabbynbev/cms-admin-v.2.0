import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys.constant';
import { giftService } from '../services';
import type { GiftListQuery, GiftPayload } from '../types';

export const useGifts = (filters: GiftListQuery) =>
  useQuery({
    queryKey: QUERY_KEYS.gifts.list(filters),
    queryFn: () => giftService.list(filters),
    placeholderData: keepPreviousData,
  });

export const useCreateGift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: GiftPayload) => giftService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.gifts.root });
    },
  });
};

export const useUpdateGift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: GiftPayload }) =>
      giftService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.gifts.root });
    },
  });
};

export const useDeleteGift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => giftService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.gifts.root });
    },
  });
};
