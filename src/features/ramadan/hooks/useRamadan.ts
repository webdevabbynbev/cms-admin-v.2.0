import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys.constant';
import { ramadanService } from '../services';
import type {
  RamadanListQuery,
  RamadanRecommendationBannerPayload,
  RamadanRecommendationPayload,
  RamadanSpinPrizePayload,
} from '../types';

// Spin Prizes
export const useRamadanSpinPrizes = (filters: RamadanListQuery) =>
  useQuery({
    queryKey: QUERY_KEYS.ramadan.spinPrizes(filters),
    queryFn: () => ramadanService.listSpinPrizes(filters),
    placeholderData: keepPreviousData,
  });

export const useCreateRamadanSpinPrize = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RamadanSpinPrizePayload) =>
      ramadanService.createSpinPrize(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ramadan.root });
    },
  });
};

export const useUpdateRamadanSpinPrize = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: RamadanSpinPrizePayload;
    }) => ramadanService.updateSpinPrize(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ramadan.root });
    },
  });
};

export const useDeleteRamadanSpinPrize = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => ramadanService.removeSpinPrize(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ramadan.root });
    },
  });
};

// Recommendations
export const useRamadanRecommendations = (filters: RamadanListQuery) =>
  useQuery({
    queryKey: QUERY_KEYS.ramadan.recommendations(filters),
    queryFn: () => ramadanService.listRecommendations(filters),
    placeholderData: keepPreviousData,
  });

export const useCreateRamadanRecommendation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RamadanRecommendationPayload) =>
      ramadanService.createRecommendation(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ramadan.root });
    },
  });
};

export const useUpdateRamadanRecommendation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: RamadanRecommendationPayload;
    }) => ramadanService.updateRecommendation(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ramadan.root });
    },
  });
};

export const useDeleteRamadanRecommendation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => ramadanService.removeRecommendation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ramadan.root });
    },
  });
};

// Banners
export const useRamadanBanners = (filters: RamadanListQuery) =>
  useQuery({
    queryKey: QUERY_KEYS.ramadan.banners(filters),
    queryFn: () => ramadanService.listBanners(filters),
    placeholderData: keepPreviousData,
  });

export const useCreateRamadanBanner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RamadanRecommendationBannerPayload) =>
      ramadanService.createBanner(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ramadan.root });
    },
  });
};

export const useUpdateRamadanBanner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: RamadanRecommendationBannerPayload;
    }) => ramadanService.updateBanner(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ramadan.root });
    },
  });
};

export const useDeleteRamadanBanner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => ramadanService.removeBanner(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ramadan.root });
    },
  });
};

// Participants (read-only)
export const useRamadanParticipants = (filters: RamadanListQuery) =>
  useQuery({
    queryKey: QUERY_KEYS.ramadan.participants(filters),
    queryFn: () => ramadanService.listParticipants(filters),
    placeholderData: keepPreviousData,
  });
