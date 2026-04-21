import { memo, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';

import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

import type { Transaction } from '../types';
import { TransactionDetailDialog } from './TransactionDetailDialog';
import { formatIDR } from '@/features/reports/utils/formatters';
import { cn } from '@/lib/utils';

const STATUS_LABELS: Record<string, string> = {
  '1': 'Belum Bayar',
  '2': 'Packing',
  '3': 'Dikirim',
  '4': 'Selesai',
  '5': 'Sudah Bayar',
  '6': 'Diterima',
  '9': 'Dibatalkan',
};

function statusClass(status: string): string {
  if (status === '9') return 'bg-destructive/10 text-destructive border-destructive/30';
  if (status === '4' || status === '6') return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400';
  if (status === '5') return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400';
  if (status === '3') return 'bg-primary/10 text-primary border-primary/30';
  return 'bg-secondary text-secondary-foreground border-transparent';
}

interface TransactionListTableProps {
  data: Transaction[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  page: number;
  perPage: number;
  onPaginationChange: (p: { page: number; perPage: number }) => void;
}

const TransactionListTableComponent = ({
  data,
  total,
  isLoading,
  isError,
  page,
  perPage,
  onPaginationChange,
}: TransactionListTableProps) => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const columns = useMemo<ColumnDef<Transaction>[]>(
    () => [
      {
        accessorKey: 'transactionNumber',
        header: 'No. Transaksi',
        cell: ({ row }) => (
          <span className="font-mono text-sm font-medium">
            {row.original.transactionNumber}
          </span>
        ),
      },
      {
        id: 'customer',
        header: 'Pelanggan',
        cell: ({ row }) => {
          const user = row.original.user;
          if (!user) return <span className="text-muted-foreground">-</span>;
          const name =
            [user.firstName, user.lastName].filter(Boolean).join(' ') || '-';
          return (
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium">{name}</span>
              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'amount',
        header: () => <div className="text-right">Total</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm font-medium">
            {formatIDR(row.original.amount)}
          </div>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <span
            className={cn(
              'rounded-full border px-2.5 py-0.5 text-xs font-medium',
              statusClass(row.original.transactionStatus),
            )}
          >
            {STATUS_LABELS[row.original.transactionStatus] ?? row.original.transactionStatus}
          </span>
        ),
      },
      {
        id: 'date',
        header: 'Tanggal',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.createdAt
              ? new Date(row.original.createdAt).toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : '-'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Aksi</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon-sm"
              title="Lihat detail"
              onClick={() => {
                setSelectedId(row.original.id);
                setSelectedTx(row.original);
              }}
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
        emptyMessage="Tidak ada transaksi."
        manualPagination
        pageCount={pageCount}
        pagination={{ pageIndex: page - 1, pageSize: perPage }}
        onPaginationChange={(p) =>
          onPaginationChange({ page: p.pageIndex + 1, perPage: p.pageSize })
        }
      />

      <TransactionDetailDialog
        transactionId={selectedId}
        transaction={selectedTx}
        onClose={() => {
          setSelectedId(null);
          setSelectedTx(null);
        }}
      />
    </>
  );
};

export const TransactionListTable = memo(TransactionListTableComponent);
