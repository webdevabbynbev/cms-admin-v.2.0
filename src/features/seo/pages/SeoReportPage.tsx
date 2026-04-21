import { Activity, MousePointerClick, Package } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
} from 'recharts';

import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { ReportSummaryCards } from '@/features/reports/components';
import { formatNumber } from '@/features/reports/utils/formatters';
import { useSeoLiveStats } from '../hooks';

const SeoReportPage = () => {
  const { data, isLoading } = useSeoLiveStats();

  const summaryCards = [
    {
      label: 'Active Users (live)',
      value: formatNumber(data?.activeUsers),
      icon: Activity,
    },
    {
      label: 'Product Clicks',
      value: formatNumber(data?.productClicks),
      icon: MousePointerClick,
    },
    {
      label: 'Top Product',
      value: data?.topProduct || '-',
      icon: Package,
    },
  ];

  const minutesData = data?.minutes ?? [];
  const cities = data?.cities ?? [];

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="SEO Report (Live)"
          description="Statistik real-time dari analytics. Dashboard-summary + traffic-report endpoint saat ini error 500 di backend; page ini hanya pakai /admin/seo/live-stats."
        />

        <ReportSummaryCards cards={summaryCards} columns={3} />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Users (30 menit terakhir)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                Memuat...
              </div>
            ) : minutesData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                Tidak ada data.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={minutesData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="minute" className="text-xs" />
                    <YAxis className="text-xs" />
                    <ChartTooltip />
                    <Bar dataKey="users" fill="#b31f5f" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {cities.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kota Teratas</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {cities.map((c) => (
                <div
                  key={c.city}
                  className="flex items-center justify-between border-b border-border py-1 last:border-b-0"
                >
                  <span className="text-sm">{c.city}</span>
                  <span className="text-sm font-medium">
                    {formatNumber(c.activeUsers)} users
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </PageContainer>
    </AppShell>
  );
};

export default SeoReportPage;
