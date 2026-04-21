import { memo, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

import { DataTable } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import type { GiftProduct } from '../types';
import { useDeleteGift } from '../hooks';
import { formatIDR } from '@/features/reports/utils/formatters';

interface GiftListTableProps {
  data: GiftProduct[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  page: number;
  perPage: number;
  onPaginationChange: (p: { page: number; perPage: number }) => void;
  onEdit: (gift: GiftProduct) => void;
}

const GiftListTableComponent = ({
  data,
  total,
  isLoading,
  isError,
  page,
  perPage,
  onPaginationChange,
  onEdit,
}: GiftListTableProps) => {
  const [deleteTarget, setDeleteTarget] = useState<GiftProduct | null>(null);
  const { mutateAsync: removeGift, isPending: isDeleting } = useDeleteGift();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await removeGift(deleteTarget.id);
      toast.success(`Gift "${deleteTarget.productName}" dihapus`);
      setDeleteTarget(null);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal menghapus gift');
      toast.error(msg);
    }
  };

  const columns = useMemo<ColumnDef<GiftProduct>[]>(
    () => [
      {
        accessorKey: 'productName',
        header: 'Gift',
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="h-10 w-10 rounded-md">
              {row.original.imageUrl ? (
                <AvatarImage
                  src={row.original.imageUrl}
                  alt={row.original.productName}
                  className="object-contain"
                />
              ) : null}
              <AvatarFallback className="rounded-md">
                {row.original.productName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium">
                {row.original.productName}
              </span>
              {row.original.variantName ? (
                <span className="truncate text-xs text-muted-foreground">
                  {row.original.variantName}
                </span>
              ) : null}
              {row.original.brandName ? (
                <span className="truncate text-xs text-muted-foreground">
                  {row.original.brandName}
                </span>
              ) : null}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'price',
        header: () => <div className="text-right">Harga</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm">{formatIDR(row.original.price)}</div>
        ),
      },
      {
        accessorKey: 'stock',
        header: () => <div className="text-right">Stok</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm">{row.original.stock}</div>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            <Badge variant={row.original.isActive ? 'default' : 'outline'}>
              {row.original.isActive ? 'Aktif' : 'Nonaktif'}
            </Badge>
            {row.original.isSellable ? (
              <Badge variant="secondary">Sellable</Badge>
            ) : null}
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
        emptyMessage="Belum ada gift."
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
        title="Hapus gift"
        description={
          deleteTarget
            ? `Hapus gift "${deleteTarget.productName}"? Aksi ini tidak bisa dibatalkan.`
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

export const GiftListTable = memo(GiftListTableComponent);
