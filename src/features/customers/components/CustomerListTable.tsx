import { memo, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';

import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import type { Customer } from '../types';
import {
  formatCustomerDateTime,
  formatCustomerPhone,
} from '../utils/formatters';
import { CustomerDetailDialog } from './CustomerDetailDialog';

interface CustomerListTableProps {
  data: Customer[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  page: number;
  perPage: number;
  onPaginationChange: (p: { page: number; perPage: number }) => void;
}

const CustomerListTableComponent = ({
  data,
  total,
  isLoading,
  isError,
  page,
  perPage,
  onPaginationChange,
}: CustomerListTableProps) => {
  const [viewTarget, setViewTarget] = useState<Customer | null>(null);

  const columns = useMemo<ColumnDef<Customer>[]>(
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
        id: 'phone',
        header: 'Nomor Telepon',
        cell: ({ row }) => (
          <span className="text-sm text-foreground">
            {formatCustomerPhone(row.original.phone, row.original.phoneNumber)}
          </span>
        ),
      },
      {
        id: 'tier',
        header: 'CRM Tier',
        cell: ({ row }) =>
          row.original.crmTier ? (
            <Badge variant="secondary">{row.original.crmTier}</Badge>
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
        id: 'created',
        header: 'Terdaftar',
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
              onClick={() => setViewTarget(row.original)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const pageCount = Math.max(1, Math.ceil(total / perPage));

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="Belum ada customer terdaftar."
        manualPagination
        pageCount={pageCount}
        pagination={{ pageIndex: page - 1, pageSize: perPage }}
        onPaginationChange={(p) =>
          onPaginationChange({ page: p.pageIndex + 1, perPage: p.pageSize })
        }
      />

      <CustomerDetailDialog
        customer={viewTarget}
        open={viewTarget !== null}
        onOpenChange={(open) => {
          if (!open) setViewTarget(null);
        }}
      />
    </>
  );
};

export const CustomerListTable = memo(CustomerListTableComponent);
