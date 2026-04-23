import { axiosClient } from '@/config/axios';
import type { ServeWrapper } from '@/lib/api-types';
import type {
  DashboardStats,
  ProductSummary,
  TrafficPoint,
  TransactionPeriodResponse,
  UserRegistrationResponse,
} from '../types';
import { TrafficRange } from '../types';

const DASHBOARD_ENDPOINTS = {
  stats: '/admin/stats-dashboard',
  topProducts: '/admin/top-product-sell',
  leastProducts: '/admin/less-product-sell',
  transactionPeriod: '/admin/total-transaction-period',
  userRegistrationPeriod: '/admin/total-register-user-period',
  traffic: '/admin/traffic-dashboard',
} as const;

function unwrapServe<T>(data: ServeWrapper<T>): T {
  return data.serve;
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const response = await axiosClient.get<ServeWrapper<DashboardStats>>(
      DASHBOARD_ENDPOINTS.stats,
    );
    return unwrapServe(response.data);
  },

  async getTopProducts(): Promise<ProductSummary[]> {
    const response = await axiosClient.get<ServeWrapper<ProductSummary[]>>(
      DASHBOARD_ENDPOINTS.topProducts,
    );
    return unwrapServe(response.data) ?? [];
  },

  async getLeastProducts(): Promise<ProductSummary[]> {
    const response = await axiosClient.get<ServeWrapper<ProductSummary[]>>(
      DASHBOARD_ENDPOINTS.leastProducts,
    );
    return unwrapServe(response.data) ?? [];
  },

  async getTransactionPeriod(): Promise<TransactionPeriodResponse> {
    const response = await axiosClient.get<ServeWrapper<TransactionPeriodResponse>>(
      DASHBOARD_ENDPOINTS.transactionPeriod,
    );
    return unwrapServe(response.data);
  },

  async getUserRegistrationPeriod(): Promise<UserRegistrationResponse> {
    const response = await axiosClient.get<ServeWrapper<UserRegistrationResponse>>(
      DASHBOARD_ENDPOINTS.userRegistrationPeriod,
    );
    return unwrapServe(response.data);
  },

  async getTraffic(days: TrafficRange): Promise<TrafficPoint[]> {
    const response = await axiosClient.get<ServeWrapper<TrafficPoint[]>>(
      DASHBOARD_ENDPOINTS.traffic,
      { params: { days } },
    );
    return unwrapServe(response.data) ?? [];
  },
};
