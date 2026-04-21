import { memo, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

import { DataTable } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import type { PickRecord } from '../types';
import { useDeletePick } from '../hooks';

interface PickListTableProps {
  endpoint: string;
  data: PickRecord[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  page: number;
  perPage: number;
  onPaginationChange: (p: { page: number; perPage: number }) => void;
  onEdit: (pick: PickRecord) => void;
}

const PickListTableComponent = ({
  endpoint,
  data,
  total,
  isLoading,
  isError,
  page,
  perPage,
  onPaginationChange,
  onEdit,
}: PickListTableProps) => {
  const [deleteTarget, setDeleteTarget] = useState<PickRecord | null>(null);
  const { mutateAsync: deletePick, isPending: isDeleting } = useDeletePick(endpoint);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePick(deleteTarget.id);
      toast.success('Pick berhasil dihapus');
      setDeleteTarget(null);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal menghapus');
      toast.error(msg);
    }
  };

  const columns = useMemo<ColumnDef<PickRecord>[]>(
    () => [
      {
        id: 'order',
        header: '#',
        cell: ({ row }) => (
          <span className="text-sm font-mono text-muted-foreground">{row.original.order}</span>
        ),
      },
      {
        id: 'product',
        header: 'Produk',
        cell: ({ row }) => {
          const p = row.original.product;
          if (!p) return <span className="text-muted-foreground text-xs">ID {row.original.productId}</span>;
          return (
            <div className="flex items-center gap-3">
              {p.imageUrl ? (
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="h-10 w-10 shrink-0 rounded object-cover"
                />
              ) : (
                <div className="h-10 w-10 shrink-0 rounded bg-muted" />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{p.name}</p>
                {p.masterSku ? (
                  <p className="truncate font-mono text-xs text-muted-foreground">{p.masterSku}</p>
                ) : null}
                {p.brandName ? (
                  <p className="truncate text-xs text-muted-foreground">{p.brandName}</p>
                ) : null}
              </div>
            </div>
          );
        },
      },
      {
        id: 'stock',
        header: () => <div className="text-right">Stok</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm">
            {row.original.product?.totalStock ?? '-'}
          </div>
        ),
      },
      {
        id: 'period',
        header: 'Periode Tampil',
        cell: ({ row }) => {
          const { startDate, endDate } = row.original;
          if (!startDate && !endDate)
            return <span className="text-xs text-muted-foreground">Selalu tampil</span>;
          const fmt = (d: string) =>
            new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
          return (
            <span className="text-xs">
              {startDate ? fmt(startDate) : '?'} – {endDate ? fmt(endDate) : '?'}
            </span>
          );
        },
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? 'default' : 'outline'}>
            {row.original.isActive ? 'Aktif' : 'Nonaktif'}
          </Badge>
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
              onClick={() => onEdit(row.original)}
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
    [onEdit],
  );

  const pageCount = Math.max(1, Math.ceil(total / perPage));

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="Belum ada picks."
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
        title="Hapus Pick"
        description={
          deleteTarget?.product
            ? `Hapus "${deleteTarget.product.name}" dari picks? Aksi ini tidak bisa dibatalkan.`
            : 'Hapus pick ini?'
        }
        confirmLabel="Hapus"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </>
  );
};

export const PickListTable = memo(PickListTableComponent);
