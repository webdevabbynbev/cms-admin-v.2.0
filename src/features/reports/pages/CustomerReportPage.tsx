import { useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Users, ShoppingBag, Wallet, TrendingUp, Crown } from 'lucide-react';
import { toast } from 'sonner';

import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';
import { DataTable } from '@/components/common/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import {
  ReportDateFilter,
  ReportExportButton,
  ReportSummaryCards,
} from '../components';
import { useRunReport } from '../hooks';
import { buildRangeFromPreset, type DateRangeValue } from '../utils/date-range';
import { formatIDR, formatNumber } from '../utils/formatters';
import {
  DateRangePreset,
  ReportChannel,
  ReportFormat,
  ReportPeriod,
  ReportType,
} from '../types';
import type {
  CreateReportPayload,
  CustomerReportData,
  CustomerReportRow,
  CustomerReportSummary,
} from '../types';

const PAGE_TITLE = 'Laporan Pelanggan';

const CustomerReportPage = () => {
  const [range, setRange] = useState<DateRangeValue>(() =>
    buildRangeFromPreset(DateRangePreset.Last7Days),
  );

  const { mutateAsync: runReport, data, isPending } = useRunReport<
    CustomerReportData,
    CustomerReportSummary
  >();

  const buildPayload = (format: ReportFormat): CreateReportPayload => ({
    title: PAGE_TITLE,
    report_type: ReportType.Customer,
    report_period: ReportPeriod.Custom,
    report_format: format,
    start_date: range.startIso,
    end_date: range.endIso,
    channel: ReportChannel.All,
    filters: {},
  });

  useEffect(() => {
    runReport(buildPayload(ReportFormat.Json)).catch((error) => {
      toast.error(error instanceof Error ? error.message : 'Gagal memuat laporan');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.startIso, range.endIso]);

  const customers = useMemo<CustomerReportRow[]>(
    () => data?.data?.customers ?? [],
    [data],
  );
  const topCustomers = useMemo<CustomerReportRow[]>(
    () => data?.data?.top_customers ?? [],
    [data],
  );
  const summary = data?.summary;

  const summaryCards = useMemo(
    () => [
      {
        label: 'Total Customers',
        value: formatNumber(summary?.total_customers),
        icon: Users,
      },
      {
        label: 'Total Transactions',
        value: formatNumber(summary?.total_transactions),
        icon: ShoppingBag,
      },
      {
        label: 'Total Revenue',
        value: formatIDR(summary?.total_revenue),
        icon: Wallet,
      },
      {
        label: 'Avg Customer Value',
        value: formatIDR(summary?.avg_customer_value),
        icon: TrendingUp,
      },
    ],
    [summary],
  );

  const columns = useMemo<ColumnDef<CustomerReportRow>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Customer',
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">{row.original.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {row.original.email}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'total_transactions',
        header: () => <div className="text-right">Orders</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm">{row.original.total_transactions}</div>
        ),
      },
      {
        accessorKey: 'total_spent',
        header: () => <div className="text-right">Total Spent</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm font-medium">
            {formatIDR(row.original.total_spent)}
          </div>
        ),
      },
      {
        accessorKey: 'avg_order_value',
        header: () => <div className="text-right">AOV</div>,
        cell: ({ row }) => (
          <div className="text-right text-xs text-muted-foreground">
            {formatIDR(row.original.avg_order_value)}
          </div>
        ),
      },
      {
        accessorKey: 'loyalty',
        header: 'Loyalty',
        cell: ({ row }) =>
          row.original.loyalty ? (
            <Badge variant="secondary">{row.original.loyalty}</Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
    ],
    [],
  );

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title={PAGE_TITLE}
          description="Analisa pelanggan + top spenders."
          actions={
            <ReportExportButton
              buildRequest={buildPayload}
              fileNamePrefix="Laporan-Pelanggan"
              disabled={isPending}
            />
          }
        />

        <ReportDateFilter value={range} onChange={setRange} />
        <ReportSummaryCards cards={summaryCards} columns={4} />

        {topCustomers.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Crown className="h-4 w-4 text-yellow-500" />
                Top Customers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                columns={columns}
                data={topCustomers}
                emptyMessage="-"
              />
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Semua Pelanggan</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={customers}
              isLoading={isPending}
              emptyMessage="Tidak ada data pelanggan."
            />
          </CardContent>
        </Card>
      </PageContainer>
    </AppShell>
  );
};

export default CustomerReportPage;
