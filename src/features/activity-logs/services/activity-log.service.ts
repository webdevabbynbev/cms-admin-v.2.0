import { axiosClient } from '@/config/axios';
import type { AdonisPaginatedPayload, ServeWrapper } from '@/lib/api-types';
import type { ActivityLog, ActivityLogListQuery } from '../types';
import { normalizeActivityLog } from '../utils/normalize';

const ACTIVITY_LOG_ENDPOINTS = {
  list: '/admin/activity-logs',
} as const;

function buildListParams(filters: ActivityLogListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  params.set('page', String(filters.page));
  params.set('per_page', String(filters.perPage));
  return params;
}

export const activityLogService = {
  async list(
    filters: ActivityLogListQuery,
  ): Promise<AdonisPaginatedPayload<ActivityLog>> {
    const params = buildListParams(filters);
    const response = await axiosClient.get<
      ServeWrapper<AdonisPaginatedPayload<unknown>>
    >(`${ACTIVITY_LOG_ENDPOINTS.list}?${params.toString()}`);
    const payload = response.data.serve;
    return {
      ...payload,
      data: (payload.data ?? []).map(normalizeActivityLog),
    };
  },
};
