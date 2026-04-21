import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys.constant';
import { flashSaleService } from '../services';
import type {
  FlashSaleFormPayload,
  FlashSaleReorderPayload,
} from '../types';

export const useFlashSales = () => {
  return useQuery({
    queryKey: QUERY_KEYS.flashSales.list,
    queryFn: () => flashSaleService.list(),
  });
};

export const useFlashSale = (id: number | string | null | undefined) => {
  return useQuery({
    queryKey: QUERY_KEYS.flashSales.detail(id ?? 'none'),
    queryFn: () => flashSaleService.getById(id as number | string),
    enabled: id != null && id !== '',
  });
};

export const useCreateFlashSale = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: FlashSaleFormPayload) =>
      flashSaleService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.flashSales.root });
    },
  });
};

export const useUpdateFlashSale = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: FlashSaleFormPayload;
    }) => flashSaleService.update(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.flashSales.root });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.flashSales.detail(variables.id),
      });
    },
  });
};

export const useDeleteFlashSale = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => flashSaleService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.flashSales.root });
    },
  });
};

export const useReorderFlashSales = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: FlashSaleReorderPayload) =>
      flashSaleService.reorder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.flashSales.root });
    },
  });
};
