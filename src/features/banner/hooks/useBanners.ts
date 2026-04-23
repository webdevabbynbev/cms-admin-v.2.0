import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys.constant';
import { bannerService } from '../services';
import type { BannerFormPayload, BannerListQuery } from '../types';

export const useBanners = (filters: BannerListQuery) => {
  return useQuery({
    queryKey: QUERY_KEYS.banners.list(filters),
    queryFn: () => bannerService.list(filters),
    placeholderData: keepPreviousData,
  });
};

export const useBanner = (id: number | string | null | undefined) => {
  return useQuery({
    queryKey: QUERY_KEYS.banners.detail(id ?? 'none'),
    queryFn: () => bannerService.getById(id as number | string),
    enabled: id != null,
  });
};

export const useCreateBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BannerFormPayload) => bannerService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.banners.root });
    },
  });
};

export const useUpdateBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: BannerFormPayload;
    }) => bannerService.update(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.banners.root });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.banners.detail(variables.id),
      });
    },
  });
};

export const useDeleteBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => bannerService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.banners.root });
    },
  });
};
