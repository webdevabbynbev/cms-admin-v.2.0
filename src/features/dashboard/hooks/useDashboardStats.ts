import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys.constant';
import { dashboardService } from '../services';

export const useDashboardStats = () => {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.stats,
    queryFn: () => dashboardService.getStats(),
  });
};
