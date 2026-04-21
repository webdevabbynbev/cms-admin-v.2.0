import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useAbeautiesSquad, useUpdateSquadStatus } from '../hooks';
import type {
  AbeautiesSquadMember,
  AbeautiesUserType,
  AbeautiesStatus,
} from '../types';
import { formatCustomerDateTime } from '@/features/customers/utils/formatters';

const DEFAULT_PER_PAGE = 10;

const statusVariant: Record<AbeautiesStatus, 'default' | 'secondary' | 'outline'> = {
  pending: 'secondary',
  approved: 'default',
  rejected: 'outline',
};

const AbeautiesSquadListPage = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [userTypeDraft, setUserTypeDraft] = useState<Record<number, AbeautiesUserType>>({});

  const { data, isLoading, isError } = useAbeautiesSquad({
    name: search.trim() || undefined,
    page,
    perPage,
  });
  const { mutateAsync: updateStatus, isPending: isUpdating } = useUpdateSquadStatus();

  const handleApprove = async (member: AbeautiesSquadMember) => {
    const userType = userTypeDraft[member.id] ?? member.userType ?? 'abeauties';
    try {
      await updateStatus({
        id: member.id,
        payload: { status: 'approved', user_type: userType },
      });
      toast.success(`${member.fullName} di-approve sebagai ${userType}`);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal approve');
      toast.error(msg);
    }
  };

  const handleReject = async (member: AbeautiesSquadMember) => {
    try {
      await updateStatus({ id: member.id, payload: { status: 'rejected' } });
      toast.success(`${member.fullName} di-reject`);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal reject');
      toast.error(msg);
    }
  };

  const columns = useMemo<ColumnDef<AbeautiesSquadMember>[]>(
    () => [
      {
        accessorKey: 'fullName',
        header: 'Nama',
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">
              {row.original.fullName || '-'}
            </span>
            {row.original.gender ? (
              <span className="truncate text-xs text-muted-foreground">
                {row.original.gender}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        id: 'social',
        header: 'Social',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1 text-xs">
            {row.original.instagramUsername ? (
              <a
                href={`https://instagram.com/${row.original.instagramUsername}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                IG: @{row.original.instagramUsername}
              </a>
            ) : null}
            {row.original.tiktokUsername ? (
              <span className="text-muted-foreground">
                TikTok: @{row.original.tiktokUsername}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: 'domisili',
        header: 'Domisili',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.domisili || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'userType',
        header: 'User Type',
        cell: ({ row }) => {
          const isFinal = row.original.status !== 'pending';
          if (isFinal) {
            return row.original.userType ? (
              <Badge variant="secondary" className="uppercase">
                {row.original.userType}
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            );
          }
          return (
            <Select
              value={
                userTypeDraft[row.original.id] ??
                row.original.userType ??
                'abeauties'
              }
              onValueChange={(v) =>
                setUserTypeDraft((prev) => ({
                  ...prev,
                  [row.original.id]: v as AbeautiesUserType,
                }))
              }
            >
              <SelectTrigger className="h-8 w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="abeauties">Abeauties</SelectItem>
                <SelectItem value="kol">KOL</SelectItem>
              </SelectContent>
            </Select>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge
            variant={statusVariant[row.original.status]}
            className="uppercase"
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: 'created',
        header: 'Tanggal',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatCustomerDateTime(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Aksi</div>,
        cell: ({ row }) => {
          if (row.original.status !== 'pending') {
            return <span className="text-xs text-muted-foreground">—</span>;
          }
          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                title="Approve"
                onClick={() => handleApprove(row.original)}
                disabled={isUpdating}
                className="text-success hover:bg-success/10 hover:text-success"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                title="Reject"
                onClick={() => handleReject(row.original)}
                disabled={isUpdating}
                className="text-error hover:bg-error-bg hover:text-error"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [userTypeDraft, isUpdating],
  );

  const pageCount = Math.max(1, Math.ceil((data?.total ?? 0) / perPage));

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="Abeauties Squad"
          description={`Daftar pendaftar Abeauties / KOL. ${data?.total ?? 0} total.`}
        />

        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Cari nama..."
          className="sm:max-w-sm"
        />

        <DataTable
          columns={columns}
          data={data?.data ?? []}
          isLoading={isLoading}
          isError={isError}
          emptyMessage="Belum ada pendaftar."
          manualPagination
          pageCount={pageCount}
          pagination={{ pageIndex: page - 1, pageSize: perPage }}
          onPaginationChange={(p) => {
            setPage(p.pageIndex + 1);
            setPerPage(p.pageSize);
          }}
        />
      </PageContainer>
    </AppShell>
  );
};

export default AbeautiesSquadListPage;
