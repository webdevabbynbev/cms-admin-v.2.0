import { memo, useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil } from 'lucide-react';

import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import type { Setting } from '../types';

function stripHtmlTags(value: string): string {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

interface SettingListTableProps {
  data: Setting[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  page: number;
  perPage: number;
  onPaginationChange: (p: { page: number; perPage: number }) => void;
  onEdit: (setting: Setting) => void;
}

const SettingListTableComponent = ({
  data,
  total,
  isLoading,
  isError,
  page,
  perPage,
  onPaginationChange,
  onEdit,
}: SettingListTableProps) => {
  const columns = useMemo<ColumnDef<Setting>[]>(
    () => [
      {
        accessorKey: 'key',
        header: 'Key',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-foreground">
            {row.original.key || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'group',
        header: 'Group',
        cell: ({ row }) =>
          row.original.group ? (
            <Badge variant="secondary">{row.original.group}</Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: 'value',
        header: 'Value',
        cell: ({ row }) => {
          const plain = stripHtmlTags(row.original.value);
          return (
            <span
              className="line-clamp-2 max-w-md text-sm text-foreground"
              title={plain}
            >
              {plain || '-'}
            </span>
          );
        },
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
          </div>
        ),
      },
    ],
    [onEdit],
  );

  const pageCount = Math.max(1, Math.ceil(total / perPage));

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      isError={isError}
      emptyMessage="Belum ada setting. Klik 'Tambah Setting' untuk membuat."
      manualPagination
      pageCount={pageCount}
      pagination={{ pageIndex: page - 1, pageSize: perPage }}
      onPaginationChange={(p) =>
        onPaginationChange({ page: p.pageIndex + 1, perPage: p.pageSize })
      }
    />
  );
};

export const SettingListTable = memo(SettingListTableComponent);
