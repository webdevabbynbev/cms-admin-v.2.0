import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys.constant';
import { concernService } from '../services';
import type {
  ConcernListQuery,
  ConcernOptionListQuery,
  ConcernOptionPayload,
  ConcernPayload,
} from '../types';

export const useConcerns = (filters: ConcernListQuery) =>
  useQuery({
    queryKey: QUERY_KEYS.concerns.list(filters),
    queryFn: () => concernService.listConcerns(filters),
    placeholderData: keepPreviousData,
  });

export const useCreateConcern = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ConcernPayload) => concernService.createConcern(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.concerns.root });
    },
  });
};

export const useUpdateConcern = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      slug,
      payload,
    }: {
      slug: string;
      payload: ConcernPayload;
    }) => concernService.updateConcern(slug, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.concerns.root });
    },
  });
};

export const useDeleteConcern = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => concernService.removeConcern(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.concerns.root });
    },
  });
};

export const useConcernOptions = (filters: ConcernOptionListQuery) =>
  useQuery({
    queryKey: QUERY_KEYS.concerns.optionList(filters),
    queryFn: () => concernService.listOptions(filters),
    placeholderData: keepPreviousData,
  });

export const useCreateConcernOption = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ConcernOptionPayload) =>
      concernService.createOption(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.concerns.root });
    },
  });
};

export const useUpdateConcernOption = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      slug,
      payload,
    }: {
      slug: string;
      payload: ConcernOptionPayload;
    }) => concernService.updateOption(slug, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.concerns.root });
    },
  });
};

export const useDeleteConcernOption = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => concernService.removeOption(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.concerns.root });
    },
  });
};
