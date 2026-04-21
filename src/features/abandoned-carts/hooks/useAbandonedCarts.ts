import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys.constant';
import { abandonedCartService } from '../services';
import type { AbandonedCartListQuery } from '../types';

export const useAbandonedCarts = (filters: AbandonedCartListQuery) =>
  useQuery({
    queryKey: QUERY_KEYS.abandonedCarts.list(filters),
    queryFn: () => abandonedCartService.list(filters),
    placeholderData: keepPreviousData,
  });
