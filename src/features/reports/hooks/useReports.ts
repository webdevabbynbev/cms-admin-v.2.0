import { useMutation, useQuery } from '@tanstack/react-query';
import { reportService } from '../services';
import type { CreateReportPayload, ReportChannel } from '../types';

export const useRunReport = <TData = unknown, TSummary = unknown>() => {
  return useMutation({
    mutationFn: (payload: CreateReportPayload) =>
      reportService.createAndWait<TData, TSummary>(payload),
  });
};

export const useDownloadReport = () => {
  return useMutation({
    mutationFn: (payload: CreateReportPayload) =>
      reportService
        .createAndWait(payload)
        .then((report) => reportService.download(report.id)),
  });
};

export const useDashboardSummary = (params: {
  start_date: string;
  end_date: string;
  channel?: ReportChannel;
}) =>
  useQuery({
    queryKey: ['reports', 'dashboard-summary', params],
    queryFn: () => reportService.fetchDashboardSummary(params),
    enabled: Boolean(params.start_date && params.end_date),
  });
