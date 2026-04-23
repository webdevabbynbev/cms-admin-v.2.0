import { axiosClient } from '@/config/axios';
import type { AdonisPaginatedPayload, ServeWrapper } from '@/lib/api-types';
import type { Transaction, TransactionListQuery } from '../types';
import { normalizeTransaction } from '../utils/normalize';

const EP = {
  list: '/admin/transactions',
  detail: (id: number | string) => `/admin/transactions/${id}`,
} as const;

function buildParams(filters: TransactionListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.transactionNumber) params.set('transaction_number', filters.transactionNumber);
  if (filters.transactionStatus) params.set('transaction_status', filters.transactionStatus);
  if (filters.startDate) params.set('start_date', filters.startDate);
  if (filters.endDate) params.set('end_date', filters.endDate);
  params.set('page', String(filters.page));
  params.set('per_page', String(filters.perPage));
  return params;
}

export const transactionService = {
  async list(filters: TransactionListQuery): Promise<AdonisPaginatedPayload<Transaction>> {
    const params = buildParams(filters);
    const response = await axiosClient.get<ServeWrapper<AdonisPaginatedPayload<unknown>>>(
      `${EP.list}?${params.toString()}`,
    );
    const payload = response.data.serve;
    return {
      ...payload,
      data: (payload.data ?? []).map(normalizeTransaction),
    };
  },

  async getDetail(id: number | string): Promise<Transaction> {
    const response = await axiosClient.get<ServeWrapper<unknown>>(EP.detail(id));
    return normalizeTransaction(response.data.serve);
  },
};
