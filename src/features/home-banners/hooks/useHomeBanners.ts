import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys.constant';
import { homeBannerService } from '../services';
import type {
  HomeBannerSectionListQuery,
  HomeBannerSectionPayload,
  HomeBannerSectionReorderPayload,
} from '../types';

export const useHomeBannerSections = (filters: HomeBannerSectionListQuery) =>
  useQuery({
    queryKey: QUERY_KEYS.homeBanners.sections(filters),
    queryFn: () => homeBannerService.listSections(filters),
    placeholderData: keepPreviousData,
  });

export const useCreateHomeBannerSection = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: HomeBannerSectionPayload) =>
      homeBannerService.createSection(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.homeBanners.root });
    },
  });
};

export const useUpdateHomeBannerSection = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: HomeBannerSectionPayload;
    }) => homeBannerService.updateSection(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.homeBanners.root });
    },
  });
};

export const useDeleteHomeBannerSection = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => homeBannerService.removeSection(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.homeBanners.root });
    },
  });
};

export const useReorderHomeBannerSections = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: HomeBannerSectionReorderPayload) =>
      homeBannerService.reorderSections(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.homeBanners.root });
    },
  });
};
