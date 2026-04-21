import { memo, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

import { DataTable } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DiscountActiveFlag,
  DiscountStatus,
} from '../types';
import type { DiscountListItem } from '../types';
import {
  useDeleteDiscount,
  useToggleDiscountStatus,
} from '../hooks';
import { formatDiscountDateTime } from '../utils/formatters';
import { isAllProductsDiscount } from '../utils/all-products-marker';
import { DiscountStatusBadge } from './DiscountStatusBadge';
import { DiscountVariantItemsDialog } from './DiscountVariantItemsDialog';

interface DiscountListTableProps {
  data: DiscountListItem[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  page: number;
  perPage: number;
  onPaginationChange: (p: { page: number; perPage: number }) => void;
  onEdit: (discount: DiscountListItem) => void;
}

const DiscountListTableComponent = ({
  data,
  total,
  isLoading,
  isError,
  page,
  perPage,
  onPaginationChange,
  onEdit,
}: DiscountListTableProps) => {
  const [deleteTarget, setDeleteTarget] = useState<DiscountListItem | null>(null);
  const [viewTarget, setViewTarget] = useState<DiscountListItem | null>(null);
  const { mutateAsync: deleteDiscount, isPending: isDeleting } = useDeleteDiscount();
  const { mutateAsync: toggleStatus } = useToggleDiscountStatus();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const identifier = deleteTarget.id || deleteTarget.code;
    try {
      await deleteDiscount(identifier);
      toast.success(`Diskon "${deleteTarget.name}" dihapus`);
      setDeleteTarget(null);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal menghapus diskon');
      toast.error(msg);
    }
  };

  const handleToggleActive = async (discount: DiscountListItem) => {
    const nextFlag =
      discount.isActive === DiscountActiveFlag.Active
        ? DiscountActiveFlag.Inactive
        : DiscountActiveFlag.Active;
    try {
      await toggleStatus({
        id: discount.id,
        code: discount.code,
        isActive: nextFlag,
      });
      toast.success(
        `Diskon "${discount.name}" ${
          nextFlag === DiscountActiveFlag.Active ? 'diaktifkan' : 'dinonaktifkan'
        }`,
      );
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal mengubah status');
      toast.error(msg);
    }
  };

  const columns = useMemo<ColumnDef<DiscountListItem>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nama',
        cell: ({ row }) => (
          <div className="flex min-w-0 max-w-sm flex-col">
            <span
              className="truncate text-sm font-medium text-foreground"
              title={row.original.name}
            >
              {row.original.name}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {row.original.code}
            </span>
          </div>
        ),
      },
      {
        id: 'scope',
        header: 'Scope',
        cell: ({ row }) => {
          const isAll = isAllProductsDiscount(row.original.description);
          if (isAll) {
            return <Badge variant="secondary">Semua Produk</Badge>;
          }
          const count = row.original.variantItems?.length ?? 0;
          return (
            <Badge variant="outline">
              {count} varian
            </Badge>
          );
        },
      },
      {
        id: 'channel',
        header: 'Channel',
        cell: ({ row }) => {
          const ec = row.original.isEcommerce === DiscountActiveFlag.Active;
          const pos = row.original.isPos === DiscountActiveFlag.Active;
          return (
            <div className="flex flex-wrap gap-1">
              {ec ? <Badge variant="outline">E-commerce</Badge> : null}
              {pos ? <Badge variant="outline">POS</Badge> : null}
              {!ec && !pos ? (
                <span className="text-xs text-muted-foreground">—</span>
              ) : null}
            </div>
          );
        },
      },
      {
        id: 'period',
        header: 'Periode',
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col text-xs text-muted-foreground">
            <span>{formatDiscountDateTime(row.original.startedAt)}</span>
            <span>s/d {formatDiscountDateTime(row.original.expiredAt)}</span>
          </div>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => <DiscountStatusBadge status={row.original.status} />,
      },
      {
        id: 'active',
        header: 'Aktif',
        cell: ({ row }) => (
          <Switch
            checked={row.original.isActive === DiscountActiveFlag.Active}
            onCheckedChange={() => handleToggleActive(row.original)}
            aria-label="Toggle aktif"
          />
        ),
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Aksi</div>,
        cell: ({ row }) => {
          const canView = row.original.status !== DiscountStatus.Inactive;
          return (
            <div className="flex items-center justify-end gap-1">
              {canView && (row.original.variantItems?.length ?? 0) > 0 ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Lihat varian"
                  onClick={() => setViewTarget(row.original)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              ) : null}
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
          );
        },
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
        emptyMessage="Belum ada diskon. Klik 'Tambah Diskon' untuk membuat."
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
        title="Hapus diskon"
        description={
          deleteTarget
            ? `Hapus diskon "${deleteTarget.name}"? Aksi ini tidak bisa dibatalkan.`
            : ''
        }
        confirmLabel="Hapus"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />

      <DiscountVariantItemsDialog
        discount={viewTarget}
        open={viewTarget !== null}
        onOpenChange={(open) => {
          if (!open) setViewTarget(null);
        }}
      />
    </>
  );
};

export const DiscountListTable = memo(DiscountListTableComponent);
