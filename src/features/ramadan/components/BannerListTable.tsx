import { memo, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

import { DataTable } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';

import type { RamadanRecommendationBanner } from '../types';
import { useDeleteRamadanBanner } from '../hooks';

interface BannerListTableProps {
  data: RamadanRecommendationBanner[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  page: number;
  perPage: number;
  onPaginationChange: (p: { page: number; perPage: number }) => void;
  onEdit: (banner: RamadanRecommendationBanner) => void;
}

const BannerListTableComponent = ({
  data,
  total,
  isLoading,
  isError,
  page,
  perPage,
  onPaginationChange,
  onEdit,
}: BannerListTableProps) => {
  const [deleteTarget, setDeleteTarget] =
    useState<RamadanRecommendationBanner | null>(null);
  const { mutateAsync: removeBanner, isPending: isDeleting } =
    useDeleteRamadanBanner();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await removeBanner(deleteTarget.id);
      toast.success(`Banner dihapus`);
      setDeleteTarget(null);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal menghapus banner');
      toast.error(msg);
    }
  };

  const columns = useMemo<ColumnDef<RamadanRecommendationBanner>[]>(
    () => [
      {
        id: 'preview',
        header: 'Preview',
        cell: ({ row }) =>
          row.original.imageUrl ? (
            <img
              src={row.original.imageUrl}
              alt={row.original.title}
              className="h-12 w-20 rounded-sm border border-border object-cover"
            />
          ) : (
            <div className="h-12 w-20 rounded-sm border border-dashed border-border" />
          ),
      },
      {
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }) => (
          <span className="text-sm font-medium">{row.original.title}</span>
        ),
      },
      {
        accessorKey: 'bannerDate',
        header: 'Tanggal',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.bannerDate ?? '-'}
          </span>
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
        emptyMessage="Belum ada banner."
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
        title="Hapus banner"
        description="Aksi ini tidak bisa dibatalkan."
        confirmLabel="Hapus"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </>
  );
};

export const BannerListTable = memo(BannerListTableComponent);
