import { memo, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';

import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import type { RamadanParticipant } from '../types';
import { ParticipantDetailDialog } from './ParticipantDetailDialog';

interface ParticipantListTableProps {
  data: RamadanParticipant[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  page: number;
  perPage: number;
  onPaginationChange: (p: { page: number; perPage: number }) => void;
}

const ParticipantListTableComponent = ({
  data,
  total,
  isLoading,
  isError,
  page,
  perPage,
  onPaginationChange,
}: ParticipantListTableProps) => {
  const [viewTarget, setViewTarget] = useState<RamadanParticipant | null>(null);

  const columns = useMemo<ColumnDef<RamadanParticipant>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nama',
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">{row.original.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {row.original.email}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'totalFasting',
        header: 'Total Fasting',
        cell: ({ row }) => (
          <Badge variant="default">{row.original.totalFasting} hari</Badge>
        ),
      },
      {
        accessorKey: 'totalNotFasting',
        header: 'Tidak Puasa',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.totalNotFasting}
          </span>
        ),
      },
      {
        id: 'milestones',
        header: 'Milestone',
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.prize7 ? (
              <Badge variant="outline">7</Badge>
            ) : null}
            {row.original.prize15 ? (
              <Badge variant="outline">15</Badge>
            ) : null}
            {row.original.prize30 ? (
              <Badge variant="outline">30</Badge>
            ) : null}
          </div>
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
              title="Detail"
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
        emptyMessage="Belum ada peserta."
        manualPagination
        pageCount={pageCount}
        pagination={{ pageIndex: page - 1, pageSize: perPage }}
        onPaginationChange={(p) =>
          onPaginationChange({ page: p.pageIndex + 1, perPage: p.pageSize })
        }
      />

      <ParticipantDetailDialog
        participant={viewTarget}
        open={viewTarget !== null}
        onOpenChange={(open) => {
          if (!open) setViewTarget(null);
        }}
      />
    </>
  );
};

export const ParticipantListTable = memo(ParticipantListTableComponent);
