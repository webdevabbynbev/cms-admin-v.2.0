import { axiosClient } from '@/config/axios';
import type { AdonisPaginatedPayload, ServeWrapper } from '@/lib/api-types';
import type {
  Voucher,
  VoucherFormPayload,
  VoucherListQuery,
  VoucherStatusPayload,
  VoucherVisibilityPayload,
} from '../types';
import { normalizeVoucher } from '../utils/normalize';

const VOUCHER_ENDPOINTS = {
  list: '/admin/voucher',
  status: '/admin/voucher/status',
  visibility: '/admin/voucher/visibility',
} as const;

function buildListParams(filters: VoucherListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.name) params.set('name', filters.name);
  if (filters.type != null) params.set('type', String(filters.type));
  if (filters.rewardType != null)
    params.set('reward_type', String(filters.rewardType));
  params.set('page', String(filters.page));
  params.set('per_page', String(filters.perPage));
  return params;
}

export const voucherService = {
  async list(
    filters: VoucherListQuery,
  ): Promise<AdonisPaginatedPayload<Voucher>> {
    const params = buildListParams(filters);
    const response = await axiosClient.get<
      ServeWrapper<AdonisPaginatedPayload<unknown>>
    >(`${VOUCHER_ENDPOINTS.list}?${params.toString()}`);
    const payload = response.data.serve;
    return {
      ...payload,
      data: (payload.data ?? []).map(normalizeVoucher),
    };
  },

  async create(payload: VoucherFormPayload): Promise<Voucher> {
    const response = await axiosClient.post<ServeWrapper<unknown>>(
      VOUCHER_ENDPOINTS.list,
      payload,
    );
    return normalizeVoucher(response.data.serve);
  },

  async update(payload: VoucherFormPayload): Promise<Voucher> {
    const response = await axiosClient.put<ServeWrapper<unknown>>(
      VOUCHER_ENDPOINTS.list,
      payload,
    );
    return normalizeVoucher(response.data.serve);
  },

  async remove(id: number | string): Promise<void> {
    await axiosClient.delete(VOUCHER_ENDPOINTS.list, { data: { id } });
  },

  async updateStatus(payload: VoucherStatusPayload): Promise<void> {
    await axiosClient.put(VOUCHER_ENDPOINTS.status, payload);
  },

  async updateVisibility(payload: VoucherVisibilityPayload): Promise<void> {
    await axiosClient.put(VOUCHER_ENDPOINTS.visibility, {
      id: payload.id,
      is_visible: payload.isVisible,
    });
  },
};
