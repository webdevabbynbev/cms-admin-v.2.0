import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys.constant';
import { saleService } from '../services';
import type { SaleListQuery, SalePayload } from '../types';

export const useSales = (filters: SaleListQuery) =>
  useQuery({
    queryKey: QUERY_KEYS.sales.list(filters),
    queryFn: () => saleService.list(filters),
    placeholderData: keepPreviousData,
  });

export const useSaleDetail = (id: number | string | null) =>
  useQuery({
    queryKey: QUERY_KEYS.sales.detail(id ?? 0),
    queryFn: () => saleService.detail(id!),
    enabled: id !== null,
  });

export const useCreateSale = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SalePayload) => saleService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sales.root });
    },
  });
};

export const useUpdateSale = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: SalePayload }) =>
      saleService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sales.root });
    },
  });
};

export const useDeleteSale = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => saleService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sales.root });
    },
  });
};

export const useToggleSalePublish = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isPublish }: { id: number | string; isPublish: boolean }) =>
      saleService.togglePublish(id, isPublish),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sales.root });
    },
  });
};
