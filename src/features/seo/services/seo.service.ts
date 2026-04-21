import { axiosClient } from '@/config/axios';
import type { SeoLiveStats } from '../types';

const EP = {
  liveStats: '/admin/seo/live-stats',
} as const;

interface DataWrapper<T> {
  status?: string;
  data: T;
}

export const seoService = {
  async fetchLiveStats(): Promise<SeoLiveStats> {
    const response = await axiosClient.get<DataWrapper<SeoLiveStats>>(EP.liveStats);
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
