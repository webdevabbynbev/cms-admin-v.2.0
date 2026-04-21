import { useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Package, Warehouse, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';
import { DataTable } from '@/components/common/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  InventoryProductRow,
  InventoryReportData,
  InventoryReportSummary,
} from '../types';

const PAGE_TITLE = 'Laporan Inventori';

const InventoryReportPage = () => {
  const [range, setRange] = useState<DateRangeValue>(() =>
    buildRangeFromPreset(DateRangePreset.Today),
  );

  const { mutateAsync: runReport, data, isPending } = useRunReport<
    InventoryReportData,
    InventoryReportSummary
  >();

  const buildPayload = (format: ReportFormat): CreateReportPayload => ({
    title: PAGE_TITLE,
    report_type: ReportType.Inventory,
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

  const products = useMemo<InventoryProductRow[]>(
    () => data?.data?.products ?? [],
    [data],
  );
  const lowStock = useMemo<InventoryProductRow[]>(
    () => data?.data?.low_stock_products ?? [],
    [data],
  );
  const summary = data?.summary;

  const summaryCards = useMemo(
    () => [
      {
        label: 'Total Produk',
        value: formatNumber(summary?.total_products),
        icon: Package,
      },
      {
        label: 'Total Nilai Stock',
        value: formatIDR(summary?.total_stock_value),
        icon: Warehouse,
      },
      {
        label: 'Low Stock',
        value: formatNumber(summary?.low_stock_count),
        icon: AlertTriangle,
      },
    ],
    [summary],
  );

  const columns = useMemo<ColumnDef<InventoryProductRow>[]>(
    () => [
      {
        accessorKey: 'sku',
        header: 'SKU',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-foreground">
            {row.original.sku || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Nama Produk',
        cell: ({ row }) => (
          <span className="text-sm text-foreground" title={row.original.name}>
            {row.original.name}
          </span>
        ),
      },
      {
        accessorKey: 'current_stock',
        header: () => <div className="text-right">Stock</div>,
        cell: ({ row }) => (
          <div className="text-right">{formatNumber(row.original.current_stock)}</div>
        ),
      },
      {
        accessorKey: 'total_sold',
        header: () => <div className="text-right">Terjual</div>,
        cell: ({ row }) => (
          <div className="text-right">{formatNumber(row.original.total_sold)}</div>
        ),
      },
      {
        accessorKey: 'base_price',
        header: () => <div className="text-right">Harga</div>,
        cell: ({ row }) => (
          <div className="text-right">{formatIDR(row.original.base_price)}</div>
        ),
      },
      {
        accessorKey: 'stock_value',
        header: () => <div className="text-right">Nilai Stock</div>,
        cell: ({ row }) => (
          <div className="text-right">{formatIDR(row.original.stock_value)}</div>
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
          description="Ringkasan stock dan low-stock produk pada periode terpilih."
          actions={
            <ReportExportButton
              buildRequest={buildPayload}
              fileNamePrefix="Laporan-Inventori"
              disabled={isPending}
            />
          }
        />

        <ReportDateFilter value={range} onChange={setRange} />

        <ReportSummaryCards cards={summaryCards} columns={3} />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Semua Produk</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={products}
              isLoading={isPending}
              emptyMessage="Tidak ada data produk."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Low Stock (&lt; 10)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={lowStock}
              isLoading={isPending}
              emptyMessage="Semua produk aman — tidak ada low stock."
            />
          </CardContent>
        </Card>
      </PageContainer>
    </AppShell>
  );
};

export default InventoryReportPage;
