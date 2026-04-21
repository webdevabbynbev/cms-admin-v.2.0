import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys.constant';
import { picksService } from '../services';
import type { PickListQuery, PickPayload, PickUpdatePayload } from '../types';

export const usePicks = (endpoint: string, filters: PickListQuery) =>
  useQuery({
    queryKey: QUERY_KEYS.picks.list(endpoint, filters),
    queryFn: () => picksService.list(endpoint, filters),
    placeholderData: keepPreviousData,
  });

export const useCreatePick = (endpoint: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PickPayload) => picksService.create(endpoint, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.picks.root(endpoint) });
    },
  });
};

export const useUpdatePick = (endpoint: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: PickUpdatePayload }) =>
      picksService.update(endpoint, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.picks.root(endpoint) });
    },
  });
};

export const useDeletePick = (endpoint: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => picksService.remove(endpoint, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.picks.root(endpoint) });
    },
  });
};
