import { memo, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

import { DataTable } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';

import type { Faq } from '../types';
import { useDeleteFaq } from '../hooks';

interface FaqListTableProps {
  data: Faq[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  page: number;
  perPage: number;
  onPaginationChange: (p: { page: number; perPage: number }) => void;
  onEdit: (faq: Faq) => void;
}

const FaqListTableComponent = ({
  data,
  total,
  isLoading,
  isError,
  page,
  perPage,
  onPaginationChange,
  onEdit,
}: FaqListTableProps) => {
  const [deleteTarget, setDeleteTarget] = useState<Faq | null>(null);
  const { mutateAsync: removeFaq, isPending: isDeleting } = useDeleteFaq();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await removeFaq(deleteTarget.id);
      toast.success('FAQ dihapus');
      setDeleteTarget(null);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal menghapus FAQ');
      toast.error(msg);
    }
  };

  const columns = useMemo<ColumnDef<Faq>[]>(
    () => [
      {
        accessorKey: 'question',
        header: 'Pertanyaan',
        cell: ({ row }) => (
          <span className="line-clamp-2 max-w-md text-sm font-medium text-foreground">
            {row.original.question}
          </span>
        ),
      },
      {
        accessorKey: 'answer',
        header: 'Jawaban',
        cell: ({ row }) => (
          <span className="line-clamp-2 max-w-lg text-xs text-muted-foreground">
            {row.original.answer}
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
        emptyMessage="Belum ada FAQ. Klik 'Tambah FAQ' untuk membuat."
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
        title="Hapus FAQ"
        description={
          deleteTarget
            ? `Hapus FAQ "${deleteTarget.question}"? Aksi ini tidak bisa dibatalkan.`
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

export const FaqListTable = memo(FaqListTableComponent);
