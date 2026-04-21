import { axiosClient } from '@/config/axios';
import type { AdonisPaginatedPayload } from '@/features/products/types';
import type { Sale, SaleDetail, SaleListQuery, SalePayload } from '../types';
import { normalizeSale, normalizeSaleDetail } from '../utils/normalize';

const EP = {
  list: '/admin/sales',
  detail: (id: number | string) => `/admin/sales/${id}`,
} as const;

interface ServeWrapper<T> {
  message?: string;
  serve: T;
}

function buildParams(filters: SaleListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.status) params.set('status', filters.status);
  params.set('page', String(filters.page));
  params.set('per_page', String(filters.perPage));
  return params;
}

export const saleService = {
  async list(filters: SaleListQuery): Promise<AdonisPaginatedPayload<Sale>> {
    const params = buildParams(filters);
    const response = await axiosClient.get<ServeWrapper<unknown>>(
      `${EP.list}?${params.toString()}`,
    );
    const serve = response.data.serve;
    // API returns serve as a flat array (no server-side pagination)
    if (Array.isArray(serve)) {
      const normalized = serve.map(normalizeSale);
      return {
        data: normalized,
        total: normalized.length,
        perPage: normalized.length || filters.perPage,
        currentPage: 1,
        lastPage: 1,
        firstPage: 1,
      };
    }
    const payload = serve as AdonisPaginatedPayload<unknown>;
    return {
      ...payload,
      data: (payload.data ?? []).map(normalizeSale),
    };
  },

  async detail(id: number | string): Promise<SaleDetail> {
    const response = await axiosClient.get<ServeWrapper<unknown>>(EP.detail(id));
    return normalizeSaleDetail(response.data.serve);
  },

  async create(payload: SalePayload): Promise<Sale> {
    const response = await axiosClient.post<ServeWrapper<unknown>>(EP.list, payload);
    return normalizeSale(response.data.serve);
  },

  async update(id: number | string, payload: SalePayload): Promise<Sale> {
    const response = await axiosClient.put<ServeWrapper<unknown>>(EP.detail(id), payload);
    return normalizeSale(response.data.serve);
  },

  async remove(id: number | string): Promise<void> {
    await axiosClient.delete(EP.detail(id));
  },

  async togglePublish(id: number | string, isPublish: boolean): Promise<void> {
    await axiosClient.put(EP.detail(id), { is_publish: isPublish });
  },
};
