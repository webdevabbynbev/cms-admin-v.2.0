import { useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Wallet,
  ShoppingBag,
  Percent,
  Truck,
  TrendingUp,
} from 'lucide-react';
import moment from 'moment-timezone';
import { toast } from 'sonner';

import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';
import { DataTable } from '@/components/common/DataTable';
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
  SalesReportData,
  SalesReportSummary,
  SalesTransactionRow,
} from '../types';

const PAGE_TITLE = 'Laporan Penjualan';

const SalesReportPage = () => {
  const [range, setRange] = useState<DateRangeValue>(() =>
    buildRangeFromPreset(DateRangePreset.Last7Days),
  );

  const { mutateAsync: runReport, data, isPending } = useRunReport<
    SalesReportData,
    SalesReportSummary
  >();

  const buildPayload = (format: ReportFormat): CreateReportPayload => ({
    title: PAGE_TITLE,
    report_type: ReportType.Sales,
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

  const rows = useMemo<SalesTransactionRow[]>(
    () => data?.data?.transactions ?? [],
    [data],
  );
  const summary = data?.summary;

  const summaryCards = useMemo(
    () => [
      {
        label: 'Total Revenue',
        value: formatIDR(summary?.total_revenue),
        icon: Wallet,
      },
      {
        label: 'Total Transactions',
        value: formatNumber(summary?.total_transactions),
        icon: ShoppingBag,
      },
      {
        label: 'Total Discount',
        value: formatIDR(summary?.total_discount),
        icon: Percent,
      },
      {
        label: 'Total Shipping',
        value: formatIDR(summary?.total_shipping),
        icon: Truck,
      },
      {
        label: 'Avg Order Value',
        value: formatIDR(summary?.avg_order_value),
        icon: TrendingUp,
      },
      {
        label: 'Total Gross Sales',
        value: formatIDR(summary?.total_gross_sales),
        icon: Wallet,
      },
    ],
    [summary],
  );

  const columns = useMemo<ColumnDef<SalesTransactionRow>[]>(
    () => [
      {
        id: 'number',
        header: 'Transaction',
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-mono text-xs font-medium">
              {row.original.transaction_number || row.original.id}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {row.original.customer_name || '-'}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'channel',
        header: 'Channel',
        cell: ({ row }) =>
          row.original.channel ? (
            <Badge variant="outline">{row.original.channel}</Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: 'total',
        header: () => <div className="text-right">Total</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm">{formatIDR(row.original.total)}</div>
        ),
      },
      {
        accessorKey: 'discount',
        header: () => <div className="text-right">Diskon</div>,
        cell: ({ row }) => (
          <div className="text-right text-xs text-muted-foreground">
            {formatIDR(row.original.discount)}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) =>
          row.original.status ? (
            <Badge variant="secondary">{row.original.status}</Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        id: 'created',
        header: 'Tanggal',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.created_at
              ? moment(row.original.created_at).format('DD MMM YYYY HH:mm')
              : '-'}
          </span>
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
          description="Daftar transaksi + metrik penjualan."
          actions={
            <ReportExportButton
              buildRequest={buildPayload}
              fileNamePrefix="Laporan-Penjualan"
              disabled={isPending}
            />
          }
        />

        <ReportDateFilter value={range} onChange={setRange} />
        <ReportSummaryCards cards={summaryCards} columns={3} />

        <DataTable
          columns={columns}
          data={rows}
          isLoading={isPending}
          emptyMessage="Tidak ada transaksi pada periode ini."
        />
      </PageContainer>
    </AppShell>
  );
};

export default SalesReportPage;
