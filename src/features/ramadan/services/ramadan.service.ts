import { axiosClient } from '@/config/axios';
import type { AdonisPaginatedPayload } from '@/features/products/types';
import { toPaginated, type MetaPaginatedResponse } from '@/lib/meta-pagination';
import type {
  RamadanListQuery,
  RamadanParticipant,
  RamadanRecommendation,
  RamadanRecommendationBanner,
  RamadanRecommendationBannerPayload,
  RamadanRecommendationPayload,
  RamadanSpinPrize,
  RamadanSpinPrizePayload,
} from '../types';
import {
  normalizeParticipant,
  normalizeRecommendation,
  normalizeRecommendationBanner,
  normalizeSpinPrize,
} from '../utils/normalize';

const EP = {
  spinList: '/admin/ramadan-spin-prizes',
  spinDetail: (id: number | string) => `/admin/ramadan-spin-prizes/${id}`,
  recList: '/admin/ramadan-recommendations',
  recDetail: (id: number | string) => `/admin/ramadan-recommendations/${id}`,
  bannerList: '/admin/ramadan-recommendation-banners',
  bannerDetail: (id: number | string) =>
    `/admin/ramadan-recommendation-banners/${id}`,
  participantList: '/admin/ramadan-participants',
} as const;

interface ServeWrapper<T> {
  message?: string;
  serve: T;
}

function buildListParams(filters: RamadanListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  params.set('page', String(filters.page));
  params.set('per_page', String(filters.perPage));
  return params;
}

export const ramadanService = {
  // --- SpinPrize ---
  async listSpinPrizes(
    filters: RamadanListQuery,
  ): Promise<AdonisPaginatedPayload<RamadanSpinPrize>> {
    const params = buildListParams(filters);
    const response = await axiosClient.get<MetaPaginatedResponse<unknown>>(
      `${EP.spinList}?${params.toString()}`,
    );
    const paginated = toPaginated(response.data);
    return {
      ...paginated,
      data: paginated.data.map(normalizeSpinPrize),
    };
  },

  async createSpinPrize(
    payload: RamadanSpinPrizePayload,
  ): Promise<RamadanSpinPrize> {
    const response = await axiosClient.post<{ data: unknown } | ServeWrapper<unknown>>(
      EP.spinList,
      payload,
    );
    const body = response.data as { data?: unknown } & Partial<ServeWrapper<unknown>>;
    return normalizeSpinPrize(body.data ?? body.serve ?? body);
  },

  async updateSpinPrize(
    id: number | string,
    payload: RamadanSpinPrizePayload,
  ): Promise<RamadanSpinPrize> {
    const response = await axiosClient.put<{ data: unknown } | ServeWrapper<unknown>>(
      EP.spinDetail(id),
      payload,
    );
    const body = response.data as { data?: unknown } & Partial<ServeWrapper<unknown>>;
    return normalizeSpinPrize(body.data ?? body.serve ?? body);
  },

  async removeSpinPrize(id: number | string): Promise<void> {
    await axiosClient.delete(EP.spinDetail(id));
  },

  // --- Recommendations ---
  async listRecommendations(
    filters: RamadanListQuery,
  ): Promise<AdonisPaginatedPayload<RamadanRecommendation>> {
    const params = buildListParams(filters);
    const response = await axiosClient.get<
      ServeWrapper<AdonisPaginatedPayload<unknown>>
    >(`${EP.recList}?${params.toString()}`);
    const payload = response.data.serve;
    return {
      ...payload,
      data: (payload.data ?? []).map(normalizeRecommendation),
    };
  },

  async createRecommendation(
    payload: RamadanRecommendationPayload,
  ): Promise<RamadanRecommendation> {
    const response = await axiosClient.post<ServeWrapper<unknown>>(
      EP.recList,
      payload,
    );
    return normalizeRecommendation(response.data.serve);
  },

  async updateRecommendation(
    id: number | string,
    payload: RamadanRecommendationPayload,
  ): Promise<RamadanRecommendation> {
    const response = await axiosClient.put<ServeWrapper<unknown>>(
      EP.recDetail(id),
      payload,
    );
    return normalizeRecommendation(response.data.serve);
  },

  async removeRecommendation(id: number | string): Promise<void> {
    await axiosClient.delete(EP.recDetail(id));
  },

  // --- Recommendation Banners ---
  async listBanners(
    filters: RamadanListQuery,
  ): Promise<AdonisPaginatedPayload<RamadanRecommendationBanner>> {
    const params = buildListParams(filters);
    const response = await axiosClient.get<
      ServeWrapper<AdonisPaginatedPayload<unknown>>
    >(`${EP.bannerList}?${params.toString()}`);
    const payload = response.data.serve;
    return {
      ...payload,
      data: (payload.data ?? []).map(normalizeRecommendationBanner),
    };
  },

  async createBanner(
    payload: RamadanRecommendationBannerPayload,
  ): Promise<RamadanRecommendationBanner> {
    const response = await axiosClient.post<ServeWrapper<unknown>>(
      EP.bannerList,
      payload,
    );
    return normalizeRecommendationBanner(response.data.serve);
  },

  async updateBanner(
    id: number | string,
    payload: RamadanRecommendationBannerPayload,
  ): Promise<RamadanRecommendationBanner> {
    const response = await axiosClient.put<ServeWrapper<unknown>>(
      EP.bannerDetail(id),
      payload,
    );
    return normalizeRecommendationBanner(response.data.serve);
  },

  async removeBanner(id: number | string): Promise<void> {
    await axiosClient.delete(EP.bannerDetail(id));
  },

  // --- Participants (read-only) ---
  async listParticipants(
    filters: RamadanListQuery,
  ): Promise<AdonisPaginatedPayload<RamadanParticipant>> {
    const params = buildListParams(filters);
    const response = await axiosClient.get<
      ServeWrapper<AdonisPaginatedPayload<unknown>>
    >(`${EP.participantList}?${params.toString()}`);
    const payload = response.data.serve;
    return {
      ...payload,
      data: (payload.data ?? []).map(normalizeParticipant),
    };
  },
};
