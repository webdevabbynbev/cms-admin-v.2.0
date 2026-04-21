import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys.constant';
import { crmService } from '../services';
import type { CrmListQuery } from '../types';

export const useCrmMembers = (filters: CrmListQuery) =>
  useQuery({
    queryKey: QUERY_KEYS.crm.members(filters),
    queryFn: () => crmService.listMembers(filters),
    placeholderData: keepPreviousData,
  });

export const useCrmAffiliates = (filters: CrmListQuery) =>
  useQuery({
    queryKey: QUERY_KEYS.crm.affiliates(filters),
    queryFn: () => crmService.listAffiliates(filters),
    placeholderData: keepPreviousData,
  });
