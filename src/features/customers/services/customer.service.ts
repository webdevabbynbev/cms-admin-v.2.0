import { axiosClient } from '@/config/axios';
import type { AdonisPaginatedPayload, ServeWrapper } from '@/lib/api-types';
import type { Customer, CustomerListQuery } from '../types';
import { normalizeCustomer } from '../utils/normalize';

const CUSTOMER_ENDPOINTS = {
  list: '/admin/customers',
} as const;

function buildListParams(filters: CustomerListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  params.set('page', String(filters.page));
  params.set('per_page', String(filters.perPage));
  return params;
}

export const customerService = {
  async list(
    filters: CustomerListQuery,
  ): Promise<AdonisPaginatedPayload<Customer>> {
    const params = buildListParams(filters);
    const response = await axiosClient.get<
      ServeWrapper<AdonisPaginatedPayload<unknown>>
    >(`${CUSTOMER_ENDPOINTS.list}?${params.toString()}`);
    const payload = response.data.serve;
    return {
      ...payload,
      data: (payload.data ?? []).map(normalizeCustomer),
    };
  },
};
