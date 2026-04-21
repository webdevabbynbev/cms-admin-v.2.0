import { memo, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2, Crown } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

import { DataTable } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import type { RamadanSpinPrize } from '../types';
import { useDeleteRamadanSpinPrize } from '../hooks';

interface SpinPrizeListTableProps {
  data: RamadanSpinPrize[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  page: number;
  perPage: number;
  onPaginationChange: (p: { page: number; perPage: number }) => void;
  onEdit: (spinPrize: RamadanSpinPrize) => void;
}

const SpinPrizeListTableComponent = ({
  data,
  total,
  isLoading,
  isError,
  page,
  perPage,
  onPaginationChange,
  onEdit,
}: SpinPrizeListTableProps) => {
  const [deleteTarget, setDeleteTarget] = useState<RamadanSpinPrize | null>(null);
  const { mutateAsync: removePrize, isPending: isDeleting } =
    useDeleteRamadanSpinPrize();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await removePrize(deleteTarget.id);
      toast.success(`Hadiah "${deleteTarget.name}" dihapus`);
      setDeleteTarget(null);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal menghapus');
      toast.error(msg);
    }
  };

  const columns = useMemo<ColumnDef<RamadanSpinPrize>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nama',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.isGrand ? (
              <Crown className="h-4 w-4 text-yellow-500" />
            ) : null}
            <span className="text-sm font-medium">{row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: 'weight',
        header: 'Weight',
        cell: ({ row }) => <Badge variant="outline">{row.original.weight}</Badge>,
      },
      {
        id: 'quota',
        header: 'Daily Quota',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.dailyQuota ?? '∞'}
          </span>
        ),
      },
      {
        id: 'voucher',
        header: 'Voucher',
        cell: ({ row }) =>
          row.original.voucherId ? (
            <Badge variant="secondary">
              #{row.original.voucherId} × {row.original.voucherQty}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
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
        emptyMessage="Belum ada hadiah spin."
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
        title="Hapus hadiah spin"
        description={
          deleteTarget
            ? `Hapus hadiah "${deleteTarget.name}"? Aksi ini tidak bisa dibatalkan.`
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

export const SpinPrizeListTable = memo(SpinPrizeListTableComponent);
