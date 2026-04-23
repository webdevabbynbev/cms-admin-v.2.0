import { axiosClient } from '@/config/axios';
import type { AdonisPaginatedPayload, ServeWrapper } from '@/lib/api-types';
import type { CrmAffiliate, CrmListQuery, CrmMember } from '../types';
import { normalizeAffiliate, normalizeMember } from '../utils/normalize';

const EP = {
  members: '/admin/crm/members',
  affiliate: '/admin/crm/affiliate',
} as const;

function buildParams(filters: CrmListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  params.set('page', String(filters.page));
  params.set('per_page', String(filters.perPage));
  return params;
}

export const crmService = {
  async listMembers(
    filters: CrmListQuery,
  ): Promise<AdonisPaginatedPayload<CrmMember>> {
    const params = buildParams(filters);
    const response = await axiosClient.get<
      ServeWrapper<AdonisPaginatedPayload<unknown>>
    >(`${EP.members}?${params.toString()}`);
    const payload = response.data.serve;
    return {
      ...payload,
      data: (payload.data ?? []).map(normalizeMember),
    };
  },

  async listAffiliates(
    filters: CrmListQuery,
  ): Promise<AdonisPaginatedPayload<CrmAffiliate>> {
    const params = buildParams(filters);
    const response = await axiosClient.get<
      ServeWrapper<AdonisPaginatedPayload<unknown>>
    >(`${EP.affiliate}?${params.toString()}`);
    const payload = response.data.serve;
    return {
      ...payload,
      data: (payload.data ?? []).map(normalizeAffiliate),
    };
  },
};
