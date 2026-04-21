import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys.constant';
import { settingService } from '../services';
import type { SettingListQuery, SettingPayload } from '../types';

export const useSettings = (filters: SettingListQuery) => {
  return useQuery({
    queryKey: QUERY_KEYS.settings.list(filters),
    queryFn: () => settingService.list(filters),
    placeholderData: keepPreviousData,
  });
};

export const useCreateSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SettingPayload) => settingService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings.root });
    },
  });
};

export const useUpdateSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SettingPayload) => settingService.update(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings.root });
    },
  });
};
