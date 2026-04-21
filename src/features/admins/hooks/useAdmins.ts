import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys.constant';
import { adminService } from '../services';
import type {
  AdminCreatePayload,
  AdminListQuery,
  AdminUpdatePayload,
} from '../types';

export const useAdmins = (filters: AdminListQuery) => {
  return useQuery({
    queryKey: QUERY_KEYS.admins.list(filters),
    queryFn: () => adminService.list(filters),
    placeholderData: keepPreviousData,
  });
};

export const useAdmin = (id: number | string | null | undefined) => {
  return useQuery({
    queryKey: QUERY_KEYS.admins.detail(id ?? 'none'),
    queryFn: () => adminService.getById(id as number | string),
    enabled: id != null && id !== '',
  });
};

export const useCreateAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdminCreatePayload) => adminService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admins.root });
    },
  });
};

export const useUpdateAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: AdminUpdatePayload;
    }) => adminService.update(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admins.root });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.admins.detail(variables.id),
      });
    },
  });
};

export const useDeleteAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => adminService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admins.root });
    },
  });
};
