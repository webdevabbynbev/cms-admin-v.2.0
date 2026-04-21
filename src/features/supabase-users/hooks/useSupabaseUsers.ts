import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys.constant';
import { supabaseUserService } from '../services';
import type { SupabaseUserListQuery } from '../types';

export const useSupabaseUsers = (filters: SupabaseUserListQuery) =>
  useQuery({
    queryKey: QUERY_KEYS.supabaseUsers.list(filters),
    queryFn: () => supabaseUserService.list(filters),
    placeholderData: keepPreviousData,
  });

export const useSupabaseUserSummary = (filters: SupabaseUserListQuery) =>
  useQuery({
    queryKey: QUERY_KEYS.supabaseUsers.summary(filters),
    queryFn: () => supabaseUserService.summary(filters),
  });
