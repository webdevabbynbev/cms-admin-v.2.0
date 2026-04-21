import { useQuery } from '@tanstack/react-query';
import { seoService } from '../services';

export const useSeoLiveStats = () =>
  useQuery({
    queryKey: ['seo', 'live-stats'],
    queryFn: () => seoService.fetchLiveStats(),
    refetchInterval: 30_000,
  });
