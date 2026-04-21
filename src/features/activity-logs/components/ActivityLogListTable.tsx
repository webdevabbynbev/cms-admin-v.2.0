import { memo, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';

import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import type { ActivityLog } from '../types';
import { formatCustomerDateTime } from '@/features/customers/utils/formatters';
import { ActivityLogDetailDialog } from './ActivityLogDetailDialog';

interface ActivityLogListTableProps {
  data: ActivityLog[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  page: number;
  perPage: number;
  onPaginationChange: (p: { page: number; perPage: number }) => void;
}

const ActivityLogListTableComponent = ({
  data,
  total,
  isLoading,
  isError,
  page,
  perPage,
  onPaginationChange,
}: ActivityLogListTableProps) => {
  const [target, setTarget] = useState<ActivityLog | null>(null);

  const columns = useMemo<ColumnDef<ActivityLog>[]>(
    () => [
      {
        accessorKey: 'userName',
        header: 'Nama',
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">
              {row.original.userName || '-'}
            </span>
            <Badge variant="secondary" className="mt-1 w-fit">
              {row.original.roleName || '-'}
            </Badge>
          </div>
        ),
      },
      {
        accessorKey: 'activity',
        header: 'Aktivitas',
        cell: ({ row }) => (
          <span className="line-clamp-2 max-w-lg text-sm text-foreground">
            {row.original.activity || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'menu',
        header: 'Modul',
        cell: ({ row }) =>
          row.original.menu ? (
            <Badge variant="outline">{row.original.menu}</Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        id: 'created',
        header: 'Waktu',
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
              onClick={() => setTarget(row.original)}
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
        emptyMessage="Belum ada aktivitas tercatat."
        manualPagination
        pageCount={pageCount}
        pagination={{ pageIndex: page - 1, pageSize: perPage }}
        onPaginationChange={(p) =>
          onPaginationChange({ page: p.pageIndex + 1, perPage: p.pageSize })
        }
      />

      <ActivityLogDetailDialog
        log={target}
        open={target !== null}
        onOpenChange={(open) => {
          if (!open) setTarget(null);
        }}
      />
    </>
  );
};

export const ActivityLogListTable = memo(ActivityLogListTableComponent);
