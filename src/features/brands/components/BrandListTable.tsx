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

import type { Brand } from '../types';
import { useDeleteBrand } from '../hooks';

interface BrandListTableProps {
  data: Brand[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  page: number;
  perPage: number;
  onPaginationChange: (p: { page: number; perPage: number }) => void;
  onEdit: (brand: Brand) => void;
}

const BrandListTableComponent = ({
  data,
  total,
  isLoading,
  isError,
  page,
  perPage,
  onPaginationChange,
  onEdit,
}: BrandListTableProps) => {
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);
  const { mutateAsync: removeBrand, isPending: isDeleting } = useDeleteBrand();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await removeBrand(deleteTarget.slug);
      toast.success(`Brand "${deleteTarget.name}" dihapus`);
      setDeleteTarget(null);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal menghapus brand');
      toast.error(msg);
    }
  };

  const columns = useMemo<ColumnDef<Brand>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Brand',
        cell: ({ row }) => {
          const initials = (row.original.name || '?').slice(0, 2).toUpperCase();
          return (
            <div className="flex min-w-0 items-center gap-3">
              <Avatar className="h-10 w-10 rounded-md">
                {row.original.logoUrl ? (
                  <AvatarImage src={row.original.logoUrl} alt={row.original.name} className="object-contain" />
                ) : null}
                <AvatarFallback className="rounded-md">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">
                  {row.original.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {row.original.slug}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'country',
        header: 'Negara',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.country || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'website',
        header: 'Website',
        cell: ({ row }) =>
          row.original.website ? (
            <a
              href={row.original.website}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary hover:underline"
            >
              {row.original.website}
            </a>
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
        emptyMessage="Belum ada brand."
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
        title="Hapus brand"
        description={
          deleteTarget
            ? `Hapus brand "${deleteTarget.name}"? Aksi ini tidak bisa dibatalkan.`
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

export const BrandListTable = memo(BrandListTableComponent);
