import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys.constant';
import { profileCategoryService } from '../services';
import type {
  ProfileCategoryListQuery,
  ProfileCategoryOptionListQuery,
  ProfileCategoryOptionPayload,
  ProfileCategoryPayload,
} from '../types';

export const useProfileCategories = (filters: ProfileCategoryListQuery) =>
  useQuery({
    queryKey: QUERY_KEYS.profileCategories.list(filters),
    queryFn: () => profileCategoryService.listCategories(filters),
    placeholderData: keepPreviousData,
  });

export const useCreateProfileCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProfileCategoryPayload) =>
      profileCategoryService.createCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.profileCategories.root,
      });
    },
  });
};

export const useUpdateProfileCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: ProfileCategoryPayload;
    }) => profileCategoryService.updateCategory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.profileCategories.root,
      });
    },
  });
};

export const useDeleteProfileCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) =>
      profileCategoryService.removeCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.profileCategories.root,
      });
    },
  });
};

export const useProfileCategoryOptions = (
  filters: ProfileCategoryOptionListQuery,
) =>
  useQuery({
    queryKey: QUERY_KEYS.profileCategories.optionList(filters),
    queryFn: () => profileCategoryService.listOptions(filters),
    placeholderData: keepPreviousData,
  });

export const useCreateProfileCategoryOption = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProfileCategoryOptionPayload) =>
      profileCategoryService.createOption(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.profileCategories.root,
      });
    },
  });
};

export const useUpdateProfileCategoryOption = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: ProfileCategoryOptionPayload;
    }) => profileCategoryService.updateOption(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.profileCategories.root,
      });
    },
  });
};

export const useDeleteProfileCategoryOption = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) =>
      profileCategoryService.removeOption(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.profileCategories.root,
      });
    },
  });
};
