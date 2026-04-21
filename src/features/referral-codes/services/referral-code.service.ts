import { axiosClient } from '@/config/axios';
import type { AdonisPaginatedPayload } from '@/features/products/types';
import { toPaginated, type MetaPaginatedResponse } from '@/lib/meta-pagination';
import type {
  ReferralCode,
  ReferralCodeListQuery,
  ReferralCodePayload,
} from '../types';
import { normalizeReferralCode } from '../utils/normalize';

const REFERRAL_ENDPOINTS = {
  list: '/admin/referral-codes',
  detail: (id: number | string) => `/admin/referral-codes/${id}`,
} as const;

function buildListParams(filters: ReferralCodeListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  params.set('page', String(filters.page));
  params.set('per_page', String(filters.perPage));
  return params;
}

export const referralCodeService = {
  async list(
    filters: ReferralCodeListQuery,
  ): Promise<AdonisPaginatedPayload<ReferralCode>> {
    const params = buildListParams(filters);
    const response = await axiosClient.get<MetaPaginatedResponse<unknown>>(
      `${REFERRAL_ENDPOINTS.list}?${params.toString()}`,
    );
    const paginated = toPaginated(response.data);
    return {
      ...paginated,
      data: paginated.data.map(normalizeReferralCode),
    };
  },

  async create(payload: ReferralCodePayload): Promise<ReferralCode> {
    const response = await axiosClient.post<unknown>(
      REFERRAL_ENDPOINTS.list,
      payload,
    );
    return normalizeReferralCode(response.data);
  },

  async update(
    id: number | string,
    payload: ReferralCodePayload,
  ): Promise<ReferralCode> {
    const response = await axiosClient.put<unknown>(
      REFERRAL_ENDPOINTS.detail(id),
      payload,
    );
    return normalizeReferralCode(response.data);
  },

  async remove(id: number | string): Promise<void> {
    await axiosClient.delete(REFERRAL_ENDPOINTS.detail(id));
  },
};
