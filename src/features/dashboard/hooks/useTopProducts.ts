import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys.constant';
import { dashboardService } from '../services';

export const useTopProducts = () => {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.topProducts,
    queryFn: () => dashboardService.getTopProducts(),
  });
};

export const useLeastProducts = () => {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.leastProducts,
    queryFn: () => dashboardService.getLeastProducts(),
  });
};
