import { useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { TrendingUp, Minus, Wallet, ReceiptText } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment-timezone';

import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';
import { DataTable } from '@/components/common/DataTable';

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
  RevenueByDateRow,
  RevenueReportData,
  RevenueReportSummary,
} from '../types';

const PAGE_TITLE = 'Laporan Pendapatan';

const RevenueReportPage = () => {
  const [range, setRange] = useState<DateRangeValue>(() =>
    buildRangeFromPreset(DateRangePreset.Today),
  );

  const { mutateAsync: runReport, data, isPending } = useRunReport<
    RevenueReportData,
    RevenueReportSummary
  >();

  const buildPayload = (format: ReportFormat): CreateReportPayload => ({
    title: PAGE_TITLE,
    report_type: ReportType.Revenue,
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

  const rows = useMemo<RevenueByDateRow[]>(
    () => data?.data?.revenue_by_date ?? [],
    [data],
  );

  const summary = data?.summary;

  const summaryCards = useMemo(
    () => [
      {
        label: 'Total Gross',
        value: formatIDR(summary?.total_gross_revenue),
        icon: Wallet,
      },
      {
        label: 'Total Diskon',
        value: formatIDR(summary?.total_discount),
        icon: Minus,
      },
      {
        label: 'Total Net',
        value: formatIDR(summary?.total_net_revenue),
        icon: TrendingUp,
      },
      {
        label: 'Total Transaksi',
        value: formatNumber(summary?.total_transactions),
        icon: ReceiptText,
      },
    ],
    [summary],
  );

  const columns = useMemo<ColumnDef<RevenueByDateRow>[]>(
    () => [
      {
        accessorKey: 'date',
        header: 'Tanggal',
        cell: ({ row }) => (
          <span className="text-sm text-foreground">
            {moment(row.original.date).format('DD MMM YYYY')}
          </span>
        ),
      },
      {
        accessorKey: 'gross_revenue',
        header: () => <div className="text-right">Gross</div>,
        cell: ({ row }) => (
          <div className="text-right">{formatIDR(row.original.gross_revenue)}</div>
        ),
      },
      {
        accessorKey: 'discount',
        header: () => <div className="text-right">Diskon</div>,
        cell: ({ row }) => (
          <div className="text-right">{formatIDR(row.original.discount)}</div>
        ),
      },
      {
        accessorKey: 'net_revenue',
        header: () => <div className="text-right">Net</div>,
        cell: ({ row }) => (
          <div className="text-right">{formatIDR(row.original.net_revenue)}</div>
        ),
      },
      {
        accessorKey: 'transactions',
        header: () => <div className="text-right">Transaksi</div>,
        cell: ({ row }) => (
          <div className="text-right">
            {formatNumber(row.original.transactions)}
          </div>
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
          description="Ringkasan pendapatan per tanggal dalam rentang waktu terpilih."
          actions={
            <ReportExportButton
              buildRequest={buildPayload}
              fileNamePrefix="Laporan-Pendapatan"
              disabled={isPending}
            />
          }
        />

        <ReportDateFilter value={range} onChange={setRange} />

        <ReportSummaryCards cards={summaryCards} columns={4} />

        <DataTable
          columns={columns}
          data={rows}
          isLoading={isPending}
          emptyMessage="Tidak ada data pendapatan untuk rentang waktu ini."
        />
      </PageContainer>
    </AppShell>
  );
};

export default RevenueReportPage;
