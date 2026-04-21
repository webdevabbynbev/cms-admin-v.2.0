import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys.constant';
import { categoryTypeService } from '../services';
import type { CategoryTypeListQuery, CategoryTypePayload } from '../types';

export const useCategoryTypes = (filters: CategoryTypeListQuery) =>
  useQuery({
    queryKey: QUERY_KEYS.categoryTypes.list(filters),
    queryFn: () => categoryTypeService.list(filters),
    placeholderData: keepPreviousData,
  });

export const useCategoryTypesFlat = (enabled = true) =>
  useQuery({
    queryKey: QUERY_KEYS.categoryTypes.flat,
    queryFn: () => categoryTypeService.flatAll(),
    enabled,
  });

export const useCreateCategoryType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CategoryTypePayload) =>
      categoryTypeService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.categoryTypes.root,
      });
    },
  });
};

export const useUpdateCategoryType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      slug,
      payload,
    }: {
      slug: string;
      payload: CategoryTypePayload;
    }) => categoryTypeService.update(slug, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.categoryTypes.root,
      });
    },
  });
};

export const useDeleteCategoryType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => categoryTypeService.remove(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.categoryTypes.root,
      });
    },
  });
};
