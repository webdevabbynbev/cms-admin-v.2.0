import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys.constant';
import { dashboardService } from '../services';
import { TrafficRange } from '../types';

export const useTransactionPeriod = () => {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.transactionPeriod,
    queryFn: () => dashboardService.getTransactionPeriod(),
  });
};

export const useUserRegistrationPeriod = () => {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.userRegistrationPeriod,
    queryFn: () => dashboardService.getUserRegistrationPeriod(),
  });
};

export const useTraffic = (days: TrafficRange) => {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard.traffic(days),
    queryFn: () => dashboardService.getTraffic(days),
  });
};
