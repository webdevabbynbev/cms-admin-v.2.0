import { axiosClient } from '@/config/axios';
import type { SeoDataWrapper, SeoLiveStats } from '../types';

const EP = {
  liveStats: '/admin/seo/live-stats',
} as const;

export const seoService = {
  async fetchLiveStats(): Promise<SeoLiveStats> {
    const response = await axiosClient.get<SeoDataWrapper<SeoLiveStats>>(EP.liveStats);
    return (
      response.data.data ?? {
        activeUsers: 0,
        productClicks: 0,
        topProduct: '',
        minutes: [],
        cities: [],
      }
    );
  },
};
