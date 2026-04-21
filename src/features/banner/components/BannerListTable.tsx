import { memo, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { ImageOff, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

import { DataTable } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BANNER_POSITION_LABELS,
  BANNER_TYPE_LABELS,
  type Banner,
} from '../types';
import { useDeleteBanner } from '../hooks';

interface BannerListTableProps {
  data: Banner[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  page: number;
  perPage: number;
  onPaginationChange: (p: { page: number; perPage: number }) => void;
  onEdit: (banner: Banner) => void;
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
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);
  const { mutateAsync: deleteBanner, isPending: isDeleting } = useDeleteBanner();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteBanner(deleteTarget.id);
      toast.success(`Deleted "${deleteTarget.title}"`);
      setDeleteTarget(null);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Failed to delete banner');
      toast.error(msg);
    }
  };

  const columns = useMemo<ColumnDef<Banner>[]>(
    () => [
      {
        id: 'image',
        header: 'Image',
        cell: ({ row }) => (
          <div className="flex h-12 w-20 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
            {row.original.image ? (
              <img
                src={row.original.image}
                alt={row.original.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <ImageOff className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        ),
      },
      {
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }) => (
          <div className="flex min-w-0 max-w-sm flex-col">
            <span
              className="truncate text-sm font-medium text-foreground"
              title={row.original.title}
            >
              {row.original.title}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {row.original.description}
            </span>
          </div>
        ),
      },
      {
        id: 'banner_type',
        header: 'Type',
        cell: ({ row }) => {
          const type = row.original.bannerType;
          return (
            <Badge variant="secondary">
              {type ? (BANNER_TYPE_LABELS[type] ?? type) : '—'}
            </Badge>
          );
        },
      },
      {
        id: 'position',
        header: 'Position',
        cell: ({ row }) => {
          const position = row.original.position;
          return (
            <span className="text-sm text-muted-foreground">
              {position ? (BANNER_POSITION_LABELS[position] ?? position) : '—'}
            </span>
          );
        },
      },
      {
        id: 'button',
        header: 'Button',
        cell: ({ row }) =>
          row.original.hasButton ? (
            <Badge variant="default">{row.original.buttonText || 'Yes'}</Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
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
              title="Delete"
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
        emptyMessage="No banners found. Click 'Add Banner' to create one."
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
        title="Delete banner"
        description={
          deleteTarget
            ? `Delete "${deleteTarget.title}"? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </>
  );
};

export const BannerListTable = memo(BannerListTableComponent);
