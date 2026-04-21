import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys.constant';
import { nedService } from '../services';
import type { NedListQuery, NedPayload } from '../types';

export const useNeds = (filters: NedListQuery) =>
  useQuery({
    queryKey: QUERY_KEYS.neds.list(filters),
    queryFn: () => nedService.list(filters),
    placeholderData: keepPreviousData,
  });

export const useCreateNed = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: NedPayload) => nedService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.neds.root });
    },
  });
};

export const useUpdateNed = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: NedPayload }) =>
      nedService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.neds.root });
    },
  });
};

export const useDeleteNed = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => nedService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.neds.root });
    },
  });
};
