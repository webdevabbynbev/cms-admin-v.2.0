import { memo, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

import { DataTable } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import type { ReferralCode } from '../types';
import { useDeleteReferralCode } from '../hooks';
import { formatCustomerDateTime } from '@/features/customers/utils/formatters';

interface ReferralCodeListTableProps {
  data: ReferralCode[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  page: number;
  perPage: number;
  onPaginationChange: (p: { page: number; perPage: number }) => void;
  onEdit: (referralCode: ReferralCode) => void;
}

const ReferralCodeListTableComponent = ({
  data,
  total,
  isLoading,
  isError,
  page,
  perPage,
  onPaginationChange,
  onEdit,
}: ReferralCodeListTableProps) => {
  const [deleteTarget, setDeleteTarget] = useState<ReferralCode | null>(null);
  const { mutateAsync: removeReferralCode, isPending: isDeleting } =
    useDeleteReferralCode();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await removeReferralCode(deleteTarget.id);
      toast.success(`Referral code "${deleteTarget.code}" dihapus`);
      setDeleteTarget(null);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal menghapus referral code');
      toast.error(msg);
    }
  };

  const columns = useMemo<ColumnDef<ReferralCode>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Kode',
        cell: ({ row }) => (
          <span className="font-mono text-sm font-semibold">
            {row.original.code}
          </span>
        ),
      },
      {
        accessorKey: 'discountPercent',
        header: 'Diskon',
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.discountPercent}%</Badge>
        ),
      },
      {
        id: 'usage',
        header: 'Usage',
        cell: ({ row }) => (
          <span className="text-xs">
            {row.original.usedCount} / {row.original.maxUsesTotal}
          </span>
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
        emptyMessage="Belum ada referral code."
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
        title="Hapus referral code"
        description={
          deleteTarget
            ? `Hapus referral code "${deleteTarget.code}"? Aksi ini tidak bisa dibatalkan.`
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

export const ReferralCodeListTable = memo(ReferralCodeListTableComponent);
