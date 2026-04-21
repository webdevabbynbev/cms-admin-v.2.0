import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys.constant';
import { activityLogService } from '../services';
import type { ActivityLogListQuery } from '../types';

export const useActivityLogs = (filters: ActivityLogListQuery) =>
  useQuery({
    queryKey: QUERY_KEYS.activityLogs.list(filters),
    queryFn: () => activityLogService.list(filters),
    placeholderData: keepPreviousData,
  });
