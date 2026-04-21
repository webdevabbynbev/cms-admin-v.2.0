import { axiosClient } from '@/config/axios';
import type { AdonisPaginatedPayload } from '@/features/products/types';
import type {
  Admin,
  AdminCreatePayload,
  AdminListQuery,
  AdminUpdatePayload,
} from '../types';
import { normalizeAdmin } from '../utils/normalize';

const ADMIN_ENDPOINTS = {
  list: '/admin/users',
  detail: (id: number | string) => `/admin/users/${id}`,
} as const;

interface ServeWrapper<T> {
  message?: string;
  serve: T;
}

function buildListParams(filters: AdminListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.role != null) params.set('role', String(filters.role));
  params.set('page', String(filters.page));
  params.set('per_page', String(filters.perPage));
  return params;
}

export const adminService = {
  async list(
    filters: AdminListQuery,
  ): Promise<AdonisPaginatedPayload<Admin>> {
    const params = buildListParams(filters);
    const response = await axiosClient.get<
      ServeWrapper<AdonisPaginatedPayload<unknown>>
    >(`${ADMIN_ENDPOINTS.list}?${params.toString()}`);
    const payload = response.data.serve;
    return {
      ...payload,
      data: (payload.data ?? []).map(normalizeAdmin),
    };
  },

  async getById(id: number | string): Promise<Admin> {
    const response = await axiosClient.get<ServeWrapper<unknown>>(
      ADMIN_ENDPOINTS.detail(id),
    );
    return normalizeAdmin(response.data.serve);
  },

  async create(payload: AdminCreatePayload): Promise<Admin> {
    const response = await axiosClient.post<ServeWrapper<unknown>>(
      ADMIN_ENDPOINTS.list,
      payload,
    );
    return normalizeAdmin(response.data.serve);
  },

  async update(
    id: number | string,
    payload: AdminUpdatePayload,
  ): Promise<Admin> {
    const response = await axiosClient.put<ServeWrapper<unknown>>(
      ADMIN_ENDPOINTS.detail(id),
      payload,
    );
    return normalizeAdmin(response.data.serve);
  },

  async remove(id: number | string): Promise<void> {
    await axiosClient.delete(ADMIN_ENDPOINTS.detail(id));
  },
};
