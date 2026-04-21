import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys.constant';
import { productService } from '../services';
import type { ProductListQuery } from '../types';

export const useProducts = (filters: ProductListQuery) => {
  return useQuery({
    queryKey: QUERY_KEYS.products.list(filters),
    queryFn: () => productService.list(filters),
    placeholderData: keepPreviousData,
  });
};

export const useProduct = (id: number | string | null | undefined) => {
  return useQuery({
    queryKey: QUERY_KEYS.products.detail(id ?? 'none'),
    queryFn: () => productService.getById(id as number | string),
    enabled: id != null,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => productService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products.root });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: Record<string, unknown>;
    }) => productService.update(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products.root });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.products.detail(variables.id),
      });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => productService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products.root });
    },
  });
};
