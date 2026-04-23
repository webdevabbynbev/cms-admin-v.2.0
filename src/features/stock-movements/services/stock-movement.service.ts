import { axiosClient } from '@/config/axios';
import type { AdonisPaginatedPayload, ServeWrapper } from '@/lib/api-types';
import type { StockMovement, StockMovementListQuery, StockAdjustmentPayload } from '../types';
import { normalizeStockMovement } from '../utils/normalize';

const EP = {
  list: '/admin/stock-movements',
  adjust: '/admin/stock-movements/adjust',
  receive: (id: number | string) => `/admin/stock-movements/${id}/receive`,
} as const;

function buildParams(filters: StockMovementListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.type) params.set('type', filters.type);
  params.set('page', String(filters.page));
  params.set('per_page', String(filters.perPage));
  return params;
}

export const stockMovementService = {
  async list(
    filters: StockMovementListQuery,
  ): Promise<AdonisPaginatedPayload<StockMovement>> {
    const params = buildParams(filters);
    const response = await axiosClient.get<
      ServeWrapper<AdonisPaginatedPayload<unknown>>
    >(`${EP.list}?${params.toString()}`);
    const payload = response.data.serve;
    return {
      ...payload,
      data: (payload.data ?? []).map(normalizeStockMovement),
    };
  },

  async markReceived(id: number | string): Promise<void> {
    await axiosClient.put(EP.receive(id));
  },

  async adjust(payload: StockAdjustmentPayload): Promise<void> {
    await axiosClient.post(EP.adjust, payload);
  },
};
