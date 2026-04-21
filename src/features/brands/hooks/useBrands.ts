import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys.constant';
import { brandService } from '../services';
import type { BrandListQuery, BrandPayload } from '../types';

export const useBrands = (filters: BrandListQuery) =>
  useQuery({
    queryKey: QUERY_KEYS.brands.list(filters),
    queryFn: () => brandService.list(filters),
    placeholderData: keepPreviousData,
  });

export const useCreateBrand = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BrandPayload) => brandService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.brands.root });
    },
  });
};

export const useUpdateBrand = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, payload }: { slug: string; payload: BrandPayload }) =>
      brandService.update(slug, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.brands.root });
    },
  });
};

export const useDeleteBrand = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => brandService.remove(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.brands.root });
    },
  });
};

export const useUploadBrandLogo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, file }: { slug: string; file: File }) =>
      brandService.uploadLogo(slug, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.brands.root });
    },
  });
};

export const useUploadBrandBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, file }: { slug: string; file: File }) =>
      brandService.uploadBanner(slug, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.brands.root });
    },
  });
};
