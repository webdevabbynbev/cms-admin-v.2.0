import { memo, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import { DataTable } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

import type { Sale } from '../types';
import { useDeleteSale, useToggleSalePublish } from '../hooks';
import { cn } from '@/lib/utils';

function saleStatus(sale: Sale): { label: string; cls: string } {
  if (!sale.isPublish)
    return { label: 'Nonaktif', cls: 'bg-destructive/10 text-destructive border-destructive/30' };
  const now = new Date();
  const start = new Date(sale.startDatetime);
  const end = new Date(sale.endDatetime);
  if (now < start)
    return { label: 'Akan Datang', cls: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400' };
  if (now > end)
    return { label: 'Berakhir', cls: 'bg-secondary text-secondary-foreground border-transparent' };
  return { label: 'Berjalan', cls: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400' };
}

interface SaleListTableProps {
  data: Sale[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  page: number;
  perPage: number;
  onPaginationChange: (p: { page: number; perPage: number }) => void;
}

const SaleListTableComponent = ({
  data,
  total,
  isLoading,
  isError,
  page,
  perPage,
  onPaginationChange,
}: SaleListTableProps) => {
  const navigate = useNavigate();
  const [deleteTarget, setDeleteTarget] = useState<Sale | null>(null);
  const { mutateAsync: deleteSale, isPending: isDeleting } = useDeleteSale();
  const { mutateAsync: togglePublish } = useToggleSalePublish();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSale(deleteTarget.id);
      toast.success('Sale berhasil dihapus');
      setDeleteTarget(null);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal menghapus sale');
      toast.error(msg);
    }
  };

  const handleTogglePublish = async (sale: Sale, value: boolean) => {
    try {
      await togglePublish({ id: sale.id, isPublish: value });
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal update status');
      toast.error(msg);
    }
  };

  const fmt = (dt: string) =>
    dt
      ? new Date(dt).toLocaleString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '-';

  const columns = useMemo<ColumnDef<Sale>[]>(
    () => [
      {
        id: 'info',
        header: 'Sale',
        cell: ({ row }) => {
          const s = saleStatus(row.original);
          return (
            <div className="flex min-w-0 flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium',
                    s.cls,
                  )}
                >
                  {s.label}
                </span>
                <span className="truncate text-sm font-medium">
                  {row.original.title ?? `Sale #${row.original.id}`}
                </span>
              </div>
              {row.original.description ? (
                <p className="line-clamp-1 text-xs text-muted-foreground">
                  {row.original.description}
                </p>
              ) : null}
            </div>
          );
        },
      },
      {
        id: 'publish',
        header: 'Aktif',
        cell: ({ row }) => (
          <Switch
            checked={row.original.isPublish}
            onCheckedChange={(v) => handleTogglePublish(row.original, v)}
          />
        ),
      },
      {
        id: 'products',
        header: () => <div className="text-right">Produk</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <Badge variant="outline">{row.original.variantCount} varian</Badge>
          </div>
        ),
      },
      {
        id: 'period',
        header: 'Periode',
        cell: ({ row }) => (
          <div className="flex flex-col text-xs text-muted-foreground">
            <span>{fmt(row.original.startDatetime)}</span>
            <span>— {fmt(row.original.endDatetime)}</span>
          </div>
        ),
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Aksi</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              title="Edit"
              onClick={() => navigate(`/sales-new/${row.original.id}`)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              title="Hapus"
              onClick={() => setDeleteTarget(row.original)}
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [navigate],
  );

  const pageCount = Math.max(1, Math.ceil(total / perPage));

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="Belum ada sale."
        manualPagination
        pageCount={pageCount}
        pagination={{ pageIndex: page - 1, pageSize: perPage }}
        onPaginationChange={(p) =>
          onPaginationChange({ page: p.pageIndex + 1, perPage: p.pageSize })
        }
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Hapus Sale"
        description={
          deleteTarget
            ? `Hapus sale "${deleteTarget.title ?? `#${deleteTarget.id}`}"? Aksi ini tidak bisa dibatalkan.`
            : ''
        }
        confirmLabel="Hapus"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </>
  );
};

export const SaleListTable = memo(SaleListTableComponent);
