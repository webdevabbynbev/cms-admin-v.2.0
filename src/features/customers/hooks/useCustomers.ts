import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys.constant';
import { customerService } from '../services';
import type { CustomerListQuery } from '../types';

export const useCustomers = (filters: CustomerListQuery) => {
  return useQuery({
    queryKey: QUERY_KEYS.customers.list(filters),
    queryFn: () => customerService.list(filters),
    placeholderData: keepPreviousData,
  });
};
