import { memo, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

import { DataTable } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import type { B1g1 } from '../types';
import { useDeleteB1g1 } from '../hooks';
import { formatCustomerDateTime } from '@/features/customers/utils/formatters';

interface B1g1ListTableProps {
  data: B1g1[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  page: number;
  perPage: number;
  onPaginationChange: (p: { page: number; perPage: number }) => void;
  onEdit: (b1g1: B1g1) => void;
}

const B1g1ListTableComponent = ({
  data,
  total,
  isLoading,
  isError,
  page,
  perPage,
  onPaginationChange,
  onEdit,
}: B1g1ListTableProps) => {
  const [deleteTarget, setDeleteTarget] = useState<B1g1 | null>(null);
  const { mutateAsync: removeB1g1, isPending: isDeleting } = useDeleteB1g1();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await removeB1g1(deleteTarget.id);
      toast.success(`B1G1 "${deleteTarget.name}" dihapus`);
      setDeleteTarget(null);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal menghapus B1G1');
      toast.error(msg);
    }
  };

  const columns = useMemo<ColumnDef<B1g1>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nama',
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">{row.original.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {row.original.code}
            </span>
          </div>
        ),
      },
      {
        id: 'period',
        header: 'Periode',
        cell: ({ row }) => (
          <div className="flex flex-col text-xs text-muted-foreground">
            <span>{formatCustomerDateTime(row.original.startedAt)}</span>
            <span>s/d {formatCustomerDateTime(row.original.expiredAt)}</span>
          </div>
        ),
      },
      {
        id: 'channel',
        header: 'Channel',
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.isEcommerce ? (
              <Badge variant="outline">E-commerce</Badge>
            ) : null}
            {row.original.isPos ? <Badge variant="outline">POS</Badge> : null}
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
        emptyMessage="Belum ada B1G1."
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
        title="Hapus B1G1"
        description={
          deleteTarget
            ? `Hapus B1G1 "${deleteTarget.name}"? Aksi ini tidak bisa dibatalkan.`
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

export const B1g1ListTable = memo(B1g1ListTableComponent);
