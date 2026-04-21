import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';

import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';
import { DataTable } from '@/components/common/DataTable';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StockAdjustmentDialog } from '../components';

import { useStockMovements } from '../hooks';
import type { StockMovement } from '../types';
import { formatCustomerDateTime } from '@/features/customers/utils/formatters';

const DEFAULT_PER_PAGE = 10;

const TYPES = ['in', 'out', 'adjustment', 'transfer', 'sale', 'return'];

const StockMovementListPage = () => {
  const [search, setSearch] = useState('');
  const [type, setType] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);

  const { data, isLoading, isError } = useStockMovements({
    q: search.trim() || undefined,
    type: type === 'all' ? undefined : type,
    page,
    perPage,
  });

  const columns = useMemo<ColumnDef<StockMovement>[]>(
    () => [
      {
        accessorKey: 'type',
        header: 'Tipe',
        cell: ({ row }) => (
          <Badge variant="secondary" className="uppercase">
            {row.original.type}
          </Badge>
        ),
      },
      {
        id: 'variant',
        header: 'Produk / SKU',
        cell: ({ row }) =>
          row.original.variant ? (
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium">
                {row.original.variant.productName || '-'}
              </span>
              <span className="truncate font-mono text-xs text-muted-foreground">
                {row.original.variant.sku || row.original.variant.barcode || '-'}
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: 'change',
        header: () => <div className="text-right">Change</div>,
        cell: ({ row }) => (
          <div
            className={`text-right text-sm font-medium ${
              row.original.change > 0
                ? 'text-success'
                : row.original.change < 0
                  ? 'text-error'
                  : ''
            }`}
          >
            {row.original.change > 0 ? '+' : ''}
            {row.original.change}
          </div>
        ),
      },
      {
        accessorKey: 'note',
        header: 'Catatan',
        cell: ({ row }) => (
          <span className="line-clamp-2 max-w-sm text-xs text-muted-foreground">
            {row.original.note || '-'}
          </span>
        ),
      },
      {
        id: 'created',
        header: 'Waktu',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatCustomerDateTime(row.original.createdAt)}
          </span>
        ),
      },
    ],
    [],
  );

  const pageCount = Math.max(1, Math.ceil((data?.total ?? 0) / perPage));

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="Stock Movement"
          description={`Riwayat pergerakan stok. ${data?.total ?? 0} total.`}
          actions={
            <Button onClick={() => setAdjustDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Buat Adjustment
            </Button>
          }
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari SKU / catatan..."
            className="sm:max-w-sm"
          />
          <Select
            value={type}
            onValueChange={(v) => {
              setType(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="Semua Tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tipe</SelectItem>
              {TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DataTable
          columns={columns}
          data={data?.data ?? []}
          isLoading={isLoading}
          isError={isError}
          emptyMessage="Belum ada stock movement."
          manualPagination
          pageCount={pageCount}
          pagination={{ pageIndex: page - 1, pageSize: perPage }}
          onPaginationChange={(p) => {
            setPage(p.pageIndex + 1);
            setPerPage(p.pageSize);
          }}
        />

        <StockAdjustmentDialog
          open={adjustDialogOpen}
          onOpenChange={setAdjustDialogOpen}
        />
      </PageContainer>
    </AppShell>
  );
};

export default StockMovementListPage;
