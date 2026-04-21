import { memo, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

import { DataTable } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  VOUCHER_REWARD_TYPE_LABELS,
  VOUCHER_TYPE_LABELS,
  VoucherActiveStatus,
  VoucherValueMode,
} from '../types';
import type { Voucher } from '../types';
import {
  useDeleteVoucher,
  useToggleVoucherStatus,
  useToggleVoucherVisibility,
} from '../hooks';
import {
  formatVoucherCurrency,
  formatVoucherDateTime,
  formatVoucherPercent,
} from '../utils/formatters';
import { deriveVoucherStatus } from '../utils/derive-status';
import { VoucherStatusBadge } from './VoucherStatusBadge';

interface VoucherListTableProps {
  data: Voucher[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  page: number;
  perPage: number;
  onPaginationChange: (p: { page: number; perPage: number }) => void;
  onEdit: (voucher: Voucher) => void;
}

const VoucherListTableComponent = ({
  data,
  total,
  isLoading,
  isError,
  page,
  perPage,
  onPaginationChange,
  onEdit,
}: VoucherListTableProps) => {
  const [deleteTarget, setDeleteTarget] = useState<Voucher | null>(null);
  const { mutateAsync: deleteVoucher, isPending: isDeleting } = useDeleteVoucher();
  const { mutateAsync: toggleStatus } = useToggleVoucherStatus();
  const { mutateAsync: toggleVisibility } = useToggleVoucherVisibility();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteVoucher(deleteTarget.id);
      toast.success(`Voucher "${deleteTarget.name}" dihapus`);
      setDeleteTarget(null);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal hapus voucher');
      toast.error(msg);
    }
  };

  const handleToggleActive = async (voucher: Voucher) => {
    const next =
      voucher.isActive === VoucherActiveStatus.Active
        ? VoucherActiveStatus.Inactive
        : VoucherActiveStatus.Active;
    try {
      await toggleStatus({ id: voucher.id, status: next });
      toast.success(
        `Voucher "${voucher.name}" ${next === VoucherActiveStatus.Active ? 'diaktifkan' : 'dinonaktifkan'}`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Gagal ubah status',
      );
    }
  };

  const handleToggleVisible = async (voucher: Voucher) => {
    try {
      await toggleVisibility({ id: voucher.id, isVisible: !voucher.isVisible });
      toast.success(
        `Voucher "${voucher.name}" ${!voucher.isVisible ? 'ditampilkan' : 'disembunyikan'}`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Gagal ubah visibilitas',
      );
    }
  };

  const columns = useMemo<ColumnDef<Voucher>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nama / Kode',
        cell: ({ row }) => (
          <div className="flex min-w-0 max-w-sm flex-col">
            <span className="truncate text-sm font-medium text-foreground">
              {row.original.name}
            </span>
            <span className="truncate font-mono text-xs text-muted-foreground">
              {row.original.code}
            </span>
          </div>
        ),
      },
      {
        id: 'type',
        header: 'Tipe',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <Badge variant="secondary">
              {VOUCHER_TYPE_LABELS[row.original.type] ?? row.original.type}
            </Badge>
            {row.original.rewardType ? (
              <Badge variant="outline" className="text-xs">
                {VOUCHER_REWARD_TYPE_LABELS[row.original.rewardType]}
              </Badge>
            ) : null}
          </div>
        ),
      },
      {
        id: 'value',
        header: 'Nilai',
        cell: ({ row }) => {
          const v = row.original;
          if (v.isPercentage === VoucherValueMode.Percentage) {
            return (
              <div className="flex flex-col text-sm">
                <span>{formatVoucherPercent(v.percentage)}</span>
                {v.maxDiscPrice ? (
                  <span className="text-xs text-muted-foreground">
                    Max {formatVoucherCurrency(v.maxDiscPrice)}
                  </span>
                ) : null}
              </div>
            );
          }
          return (
            <span className="font-mono text-sm">
              {formatVoucherCurrency(v.price)}
            </span>
          );
        },
      },
      {
        id: 'quota',
        header: 'Kuota',
        cell: ({ row }) => (
          <div className="flex flex-col text-sm">
            <span>
              {row.original.usedCount} / {row.original.qty || '∞'}
            </span>
            {row.original.perUserLimit ? (
              <span className="text-xs text-muted-foreground">
                {row.original.perUserLimit}/user
              </span>
            ) : null}
          </div>
        ),
      },
      {
        id: 'period',
        header: 'Periode',
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col text-xs text-muted-foreground">
            <span>{formatVoucherDateTime(row.original.startedAt)}</span>
            <span>s/d {formatVoucherDateTime(row.original.expiredAt)}</span>
          </div>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <VoucherStatusBadge status={deriveVoucherStatus(row.original)} />
        ),
      },
      {
        id: 'active',
        header: 'Aktif',
        cell: ({ row }) => (
          <Switch
            checked={row.original.isActive === VoucherActiveStatus.Active}
            onCheckedChange={() => handleToggleActive(row.original)}
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
              title={row.original.isVisible ? 'Sembunyikan' : 'Tampilkan'}
              onClick={() => handleToggleVisible(row.original)}
            >
              {row.original.isVisible ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
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
        emptyMessage="Belum ada voucher."
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
        title="Hapus voucher"
        description={
          deleteTarget
            ? `Hapus voucher "${deleteTarget.name}"? Aksi ini tidak bisa dibatalkan.`
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

export const VoucherListTable = memo(VoucherListTableComponent);
