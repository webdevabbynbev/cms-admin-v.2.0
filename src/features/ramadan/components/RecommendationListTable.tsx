import { memo, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

import { DataTable } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import type { RamadanRecommendation } from '../types';
import { useDeleteRamadanRecommendation } from '../hooks';

interface RecommendationListTableProps {
  data: RamadanRecommendation[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  page: number;
  perPage: number;
  onPaginationChange: (p: { page: number; perPage: number }) => void;
  onEdit: (recommendation: RamadanRecommendation) => void;
}

const RecommendationListTableComponent = ({
  data,
  total,
  isLoading,
  isError,
  page,
  perPage,
  onPaginationChange,
  onEdit,
}: RecommendationListTableProps) => {
  const [deleteTarget, setDeleteTarget] = useState<RamadanRecommendation | null>(null);
  const { mutateAsync: removeRec, isPending: isDeleting } =
    useDeleteRamadanRecommendation();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await removeRec(deleteTarget.id);
      toast.success(`Recommendation dihapus`);
      setDeleteTarget(null);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal menghapus');
      toast.error(msg);
    }
  };

  const columns = useMemo<ColumnDef<RamadanRecommendation>[]>(
    () => [
      {
        accessorKey: 'productName',
        header: 'Produk',
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">
              {row.original.productName || '(unnamed)'}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              Product ID: {row.original.productId ?? '-'}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'position',
        header: 'Posisi',
        cell: ({ row }) => <Badge variant="outline">{row.original.position}</Badge>,
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
        emptyMessage="Belum ada recommendation."
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
        title="Hapus recommendation"
        description="Aksi ini tidak bisa dibatalkan."
        confirmLabel="Hapus"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </>
  );
};

export const RecommendationListTable = memo(RecommendationListTableComponent);
