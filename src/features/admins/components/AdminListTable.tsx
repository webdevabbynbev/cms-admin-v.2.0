import { memo, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

import { DataTable } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import type { Admin } from '../types';
import { useDeleteAdmin } from '../hooks';
import { formatCustomerDateTime } from '@/features/customers/utils/formatters';

interface AdminListTableProps {
  data: Admin[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  page: number;
  perPage: number;
  onPaginationChange: (p: { page: number; perPage: number }) => void;
  onEdit: (admin: Admin) => void;
  onView: (admin: Admin) => void;
}

const AdminListTableComponent = ({
  data,
  total,
  isLoading,
  isError,
  page,
  perPage,
  onPaginationChange,
  onEdit,
  onView,
}: AdminListTableProps) => {
  const [deleteTarget, setDeleteTarget] = useState<Admin | null>(null);
  const { mutateAsync: removeAdmin, isPending: isDeleting } = useDeleteAdmin();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await removeAdmin(deleteTarget.id);
      toast.success(`Admin "${deleteTarget.name}" dihapus`);
      setDeleteTarget(null);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal menghapus admin');
      toast.error(msg);
    }
  };

  const columns = useMemo<ColumnDef<Admin>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nama',
        cell: ({ row }) => (
          <div className="flex min-w-0 max-w-xs flex-col">
            <span className="truncate text-sm font-medium text-foreground">
              {row.original.name || '-'}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {row.original.email}
            </span>
          </div>
        ),
      },
      {
        id: 'role',
        header: 'Role',
        cell: ({ row }) => (
          <Badge variant="default">{row.original.roleName || '-'}</Badge>
        ),
      },
      {
        id: 'permissions',
        header: 'Permissions',
        cell: ({ row }) => (
          <Badge variant="outline">
            {row.original.permissions.length} module
          </Badge>
        ),
      },
      {
        id: 'created',
        header: 'Dibuat',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatCustomerDateTime(row.original.createdAt)}
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
              title="Lihat detail"
              onClick={() => onView(row.original)}
            >
              <Eye className="h-4 w-4" />
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
    [onEdit, onView],
  );

  const pageCount = Math.max(1, Math.ceil(total / perPage));

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="Belum ada admin terdaftar."
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
        title="Hapus admin"
        description={
          deleteTarget
            ? `Hapus admin "${deleteTarget.name}"? Aksi ini tidak bisa dibatalkan.`
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

export const AdminListTable = memo(AdminListTableComponent);
