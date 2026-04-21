import { memo, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

import { DataTable } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

import type { FlashSaleListItem } from '../types';
import { useDeleteFlashSale, useUpdateFlashSale } from '../hooks';
import { formatFlashSaleDateTime } from '../utils/formatters';
import { buildFlashSalePayload } from '../utils/build-payload';
import { hydrateFlashSaleForm } from '../utils/hydrate-form';
import { FlashSaleStatusBadge } from './FlashSaleStatusBadge';

interface FlashSaleListTableProps {
  data: FlashSaleListItem[];
  isLoading: boolean;
  isError: boolean;
  onEdit: (sale: FlashSaleListItem) => void;
}

const FlashSaleListTableComponent = ({
  data,
  isLoading,
  isError,
  onEdit,
}: FlashSaleListTableProps) => {
  const [deleteTarget, setDeleteTarget] = useState<FlashSaleListItem | null>(null);
  const { mutateAsync: removeFlashSale, isPending: isDeleting } = useDeleteFlashSale();
  const { mutateAsync: updateFlashSale } = useUpdateFlashSale();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await removeFlashSale(deleteTarget.id);
      toast.success(`Flash Sale "${deleteTarget.title}" dihapus`);
      setDeleteTarget(null);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal menghapus flash sale');
      toast.error(msg);
    }
  };

  const handleTogglePublish = async (sale: FlashSaleListItem) => {
    try {
      const hydrated = hydrateFlashSaleForm(sale);
      const payload = buildFlashSalePayload({
        ...hydrated,
        isPublish: !sale.isPublish,
      });
      await updateFlashSale({ id: sale.id, payload });
      toast.success(
        `Flash Sale "${sale.title}" ${!sale.isPublish ? 'dipublish' : 'di-unpublish'}`,
      );
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal mengubah status publish');
      toast.error(msg);
    }
  };

  const columns = useMemo<ColumnDef<FlashSaleListItem>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'Judul',
        cell: ({ row }) => (
          <div className="flex min-w-0 max-w-sm flex-col">
            <span
              className="truncate text-sm font-medium text-foreground"
              title={row.original.title}
            >
              {row.original.title}
            </span>
            {row.original.description ? (
              <span className="truncate text-xs text-muted-foreground">
                {row.original.description}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        id: 'variants',
        header: 'Produk',
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.totalVariants} item</Badge>
        ),
      },
      {
        id: 'period',
        header: 'Periode',
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col text-xs text-muted-foreground">
            <span>{formatFlashSaleDateTime(row.original.startDatetime)}</span>
            <span>s/d {formatFlashSaleDateTime(row.original.endDatetime)}</span>
          </div>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => <FlashSaleStatusBadge status={row.original.status} />,
      },
      {
        id: 'publish',
        header: 'Publish',
        cell: ({ row }) => (
          <Switch
            checked={row.original.isPublish}
            onCheckedChange={() => handleTogglePublish(row.original)}
            aria-label="Toggle publish"
          />
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

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="Belum ada flash sale. Klik 'Tambah Flash Sale' untuk membuat."
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Hapus flash sale"
        description={
          deleteTarget
            ? `Hapus flash sale "${deleteTarget.title}"? Aksi ini tidak bisa dibatalkan.`
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

export const FlashSaleListTable = memo(FlashSaleListTableComponent);
