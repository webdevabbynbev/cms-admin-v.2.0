import { axiosClient } from '@/config/axios';
import type {
  CreateReportPayload,
  DashboardSummaryData,
  Report,
  ReportChannel,
} from '../types';
import { ReportStatus } from '../types';

const REPORT_ENDPOINTS = {
  list: '/admin/reports',
  detail: (id: number | string) => `/admin/reports/${id}`,
  download: (id: number | string) => `/admin/reports/${id}/download`,
  dashboardSummary: '/admin/reports/dashboard-summary',
} as const;

interface ServeWrapper<T> {
  message?: string;
  serve: T;
}

export const reportService = {
  async create<TData = unknown, TSummary = unknown>(
    payload: CreateReportPayload,
  ): Promise<Report<TData, TSummary>> {
    const response = await axiosClient.post<
      ServeWrapper<Report<TData, TSummary>>
    >(REPORT_ENDPOINTS.list, payload, { timeout: 120_000 });
    return response.data.serve;
  },

  async getById<TData = unknown, TSummary = unknown>(
    id: number | string,
  ): Promise<Report<TData, TSummary>> {
    const response = await axiosClient.get<ServeWrapper<Report<TData, TSummary>>>(
      REPORT_ENDPOINTS.detail(id),
    );
    return response.data.serve;
  },

  async download(id: number | string): Promise<Blob> {
    const response = await axiosClient.get<Blob>(REPORT_ENDPOINTS.download(id), {
      responseType: 'blob',
      timeout: 0,
    });
    return response.data;
  },

  async createAndWait<TData = unknown, TSummary = unknown>(
    payload: CreateReportPayload,
    opts?: { maxTries?: number; intervalMs?: number },
  ): Promise<Report<TData, TSummary>> {
    const maxTries = opts?.maxTries ?? 25;
    const intervalMs = opts?.intervalMs ?? 800;

    const created = await reportService.create<TData, TSummary>(payload);
    if (!created?.id) {
      throw new Error('Gagal membuat laporan (id kosong)');
    }

    let tries = 0;
    while (tries < maxTries) {
      tries += 1;
      const current = await reportService.getById<TData, TSummary>(created.id);
      if (current.status === ReportStatus.Completed) return current;
      if (current.status === ReportStatus.Failed) {
        throw new Error(current.errorMessage ?? 'Report failed');
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    return reportService.getById<TData, TSummary>(created.id);
  },

  async fetchDashboardSummary(params: {
    start_date: string;
    end_date: string;
    channel?: ReportChannel;
  }): Promise<DashboardSummaryData> {
    const response = await axiosClient.get<ServeWrapper<DashboardSummaryData>>(
      REPORT_ENDPOINTS.dashboardSummary,
      { params },
    );
    return response.data.serve;
  },
};
