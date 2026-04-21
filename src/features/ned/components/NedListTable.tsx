import { memo, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

import { DataTable } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import type { Ned } from '../types';
import { useDeleteNed } from '../hooks';
import { formatIDR } from '@/features/reports/utils/formatters';

interface NedListTableProps {
  data: Ned[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  page: number;
  perPage: number;
  onPaginationChange: (p: { page: number; perPage: number }) => void;
  onEdit: (ned: Ned) => void;
}

const NedListTableComponent = ({
  data,
  total,
  isLoading,
  isError,
  page,
  perPage,
  onPaginationChange,
  onEdit,
}: NedListTableProps) => {
  const [deleteTarget, setDeleteTarget] = useState<Ned | null>(null);
  const { mutateAsync: removeNed, isPending: isDeleting } = useDeleteNed();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await removeNed(deleteTarget.id);
      toast.success(`NED "${deleteTarget.name}" dihapus`);
      setDeleteTarget(null);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal menghapus NED');
      toast.error(msg);
    }
  };

  const columns = useMemo<ColumnDef<Ned>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nama',
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">{row.original.name}</span>
            {row.original.sku ? (
              <span className="truncate font-mono text-xs text-muted-foreground">
                {row.original.sku}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: 'price',
        header: () => <div className="text-right">Harga</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm">
            {row.original.price != null ? formatIDR(row.original.price) : '-'}
          </div>
        ),
      },
      {
        accessorKey: 'quantity',
        header: () => <div className="text-right">Qty</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm">{row.original.quantity ?? '-'}</div>
        ),
      },
      {
        id: 'visibility',
        header: 'Visible',
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.isVisibleEcommerce ? (
              <Badge variant="outline">E-commerce</Badge>
            ) : null}
            {row.original.isVisiblePos ? <Badge variant="outline">POS</Badge> : null}
          </div>
        ),
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
              className="text-error hover:bg-error-bg hover:text-error"
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
        emptyMessage="Belum ada NED."
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
        title="Hapus NED"
        description={
          deleteTarget
            ? `Hapus NED "${deleteTarget.name}"? Aksi ini tidak bisa dibatalkan.`
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

export const NedListTable = memo(NedListTableComponent);
