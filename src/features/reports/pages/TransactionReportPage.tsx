import { useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { ShoppingBag, Wallet, Percent, TrendingUp } from 'lucide-react';
import moment from 'moment-timezone';
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
  TransactionReportData,
  TransactionReportRow,
  TransactionReportSummary,
} from '../types';

const PAGE_TITLE = 'Laporan Transaksi';

const BreakdownCard = ({
  title,
  data,
  valueFormatter,
}: {
  title: string;
  data: Record<string, number> | undefined;
  valueFormatter?: (v: number) => string;
}) => {
  const entries = data ? Object.entries(data) : [];
  if (entries.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {entries.map(([key, value]) => (
          <div
            key={key}
            className="flex items-center justify-between border-b border-border py-1 last:border-b-0"
          >
            <span className="text-sm text-foreground">{key}</span>
            <span className="text-sm font-medium">
              {valueFormatter ? valueFormatter(value) : formatNumber(value)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

const TransactionReportPage = () => {
  const [range, setRange] = useState<DateRangeValue>(() =>
    buildRangeFromPreset(DateRangePreset.Last7Days),
  );

  const { mutateAsync: runReport, data, isPending } = useRunReport<
    TransactionReportData,
    TransactionReportSummary
  >();

  const buildPayload = (format: ReportFormat): CreateReportPayload => ({
    title: PAGE_TITLE,
    report_type: ReportType.Transaction,
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

  const rows = useMemo<TransactionReportRow[]>(
    () => data?.data?.transactions ?? [],
    [data],
  );
  const summary = data?.summary;

  const summaryCards = useMemo(
    () => [
      {
        label: 'Total Transactions',
        value: formatNumber(summary?.total_transactions),
        icon: ShoppingBag,
      },
      {
        label: 'Total Amount',
        value: formatIDR(summary?.total_amount),
        icon: Wallet,
      },
      {
        label: 'Total Discount',
        value: formatIDR(summary?.total_discount),
        icon: Percent,
      },
      {
        label: 'Avg Transaction Value',
        value: formatIDR(summary?.avg_transaction_value),
        icon: TrendingUp,
      },
    ],
    [summary],
  );

  const columns = useMemo<ColumnDef<TransactionReportRow>[]>(
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
        accessorKey: 'payment_method',
        header: 'Payment',
        cell: ({ row }) => (
          <span className="text-xs">{row.original.payment_method || '-'}</span>
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
          description="Daftar transaksi + breakdown status/channel/payment. Detail modal + order tracking deferred."
          actions={
            <ReportExportButton
              buildRequest={buildPayload}
              fileNamePrefix="Laporan-Transaksi"
              disabled={isPending}
            />
          }
        />

        <ReportDateFilter value={range} onChange={setRange} />
        <ReportSummaryCards cards={summaryCards} columns={4} />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <BreakdownCard
            title="Status Breakdown"
            data={data?.data?.status_breakdown}
          />
          <BreakdownCard
            title="Channel Breakdown"
            data={data?.data?.channel_breakdown}
          />
          <BreakdownCard
            title="Payment Method"
            data={data?.data?.payment_method_breakdown}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Semua Transaksi ({rows.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={rows}
              isLoading={isPending}
              emptyMessage="Tidak ada transaksi pada periode ini."
            />
          </CardContent>
        </Card>
      </PageContainer>
    </AppShell>
  );
};

export default TransactionReportPage;
