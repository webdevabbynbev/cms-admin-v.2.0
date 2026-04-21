import { useMemo, useState } from 'react';
import {
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  TrendingUp,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
} from 'recharts';
import moment from 'moment-timezone';

import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import {
  ReportDateFilter,
  ReportSummaryCards,
} from '../components';
import { useDashboardSummary } from '../hooks';
import { buildRangeFromPreset, type DateRangeValue } from '../utils/date-range';
import { formatIDR, formatNumber } from '../utils/formatters';
import { DateRangePreset, ReportChannel } from '../types';

const PAGE_TITLE = 'Dashboard Report';

const DashboardReportPage = () => {
  const [range, setRange] = useState<DateRangeValue>(() =>
    buildRangeFromPreset(DateRangePreset.Last7Days),
  );

  const { data, isLoading } = useDashboardSummary({
    start_date: range.startIso,
    end_date: range.endIso,
    channel: ReportChannel.All,
  });

  const summary = data?.summary;
  const trend = data?.trend ?? [];

  const summaryCards = useMemo(
    () => [
      {
        label: 'Total Sales',
        value: formatIDR(summary?.total_sales),
        icon: DollarSign,
        helper:
          summary?.growth.sales != null
            ? `${summary.growth.sales > 0 ? '+' : ''}${summary.growth.sales}% vs previous`
            : undefined,
      },
      {
        label: 'Total Orders',
        value: formatNumber(summary?.total_orders),
        icon: ShoppingBag,
        helper:
          summary?.growth.orders != null
            ? `${summary.growth.orders > 0 ? '+' : ''}${summary.growth.orders}%`
            : undefined,
      },
      {
        label: 'Products Sold',
        value: formatNumber(summary?.products_sold),
        icon: Package,
      },
      {
        label: 'Conversion Rate',
        value: summary?.conversion_rate ? `${summary.conversion_rate.toFixed(2)}%` : '-',
        icon: TrendingUp,
      },
      {
        label: 'Total Visitors',
        value: formatNumber(summary?.total_visitors),
        icon: Users,
      },
      {
        label: 'Total Buyers',
        value: formatNumber(summary?.total_buyers),
        icon: Users,
      },
      {
        label: 'AOV',
        value: formatIDR(summary?.aov),
        icon: DollarSign,
        helper: 'Average Order Value',
      },
      {
        label: 'ASP',
        value: formatIDR(summary?.asp),
        icon: DollarSign,
        helper: 'Average Selling Price',
      },
    ],
    [summary],
  );

  const trendData = useMemo(
    () =>
      trend.map((t) => ({
        ...t,
        date: moment(t.date).format('DD MMM'),
      })),
    [trend],
  );

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title={PAGE_TITLE}
          description="Ringkasan performa website & penjualan."
        />

        <ReportDateFilter value={range} onChange={setRange} />

        <ReportSummaryCards cards={summaryCards} columns={4} />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trend Sales &amp; Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                Memuat...
              </div>
            ) : trendData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                Tidak ada data untuk rentang waktu ini.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <ChartTooltip />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#b31f5f"
                      fill="#b31f5f"
                      fillOpacity={0.2}
                      name="sales"
                    />
                    <Area
                      type="monotone"
                      dataKey="orders"
                      stroke="#1282a2"
                      fill="#1282a2"
                      fillOpacity={0.2}
                      name="orders"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </PageContainer>
    </AppShell>
  );
};

export default DashboardReportPage;
