import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys.constant';
import { b1g1Service } from '../services';
import type { B1g1ListQuery, B1g1Payload } from '../types';

export const useB1g1List = (filters: B1g1ListQuery) =>
  useQuery({
    queryKey: QUERY_KEYS.b1g1.list(filters),
    queryFn: () => b1g1Service.list(filters),
    placeholderData: keepPreviousData,
  });

export const useCreateB1g1 = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: B1g1Payload) => b1g1Service.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.b1g1.root });
    },
  });
};

export const useUpdateB1g1 = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: B1g1Payload }) =>
      b1g1Service.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.b1g1.root });
    },
  });
};

export const useDeleteB1g1 = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => b1g1Service.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.b1g1.root });
    },
  });
};
