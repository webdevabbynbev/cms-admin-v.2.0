import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';

import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';
import { DataTable } from '@/components/common/DataTable';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { useCrmMembers } from '../hooks';
import type { CrmMember } from '../types';
import { formatIDR } from '@/features/reports/utils/formatters';

const DEFAULT_PER_PAGE = 10;

const CrmMemberListPage = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

  const { data, isLoading, isError } = useCrmMembers({
    q: search.trim() || undefined,
    page,
    perPage,
  });

  const columns = useMemo<ColumnDef<CrmMember>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Member',
        cell: ({ row }) => {
          const initials = (row.original.name || '?').slice(0, 2).toUpperCase();
          return (
            <div className="flex min-w-0 items-center gap-3">
              <Avatar className="h-10 w-10">
                {row.original.photoProfileUrl ? (
                  <AvatarImage src={row.original.photoProfileUrl} alt={row.original.name} />
                ) : null}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">{row.original.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {row.original.email}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'crmTier',
        header: 'Tier',
        cell: ({ row }) => <Badge variant="secondary">{row.original.crmTier}</Badge>,
      },
      {
        accessorKey: 'totalOrders',
        header: () => <div className="text-right">Orders</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm">{row.original.totalOrders}</div>
        ),
      },
      {
        accessorKey: 'ltv',
        header: () => <div className="text-right">LTV</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm">{formatIDR(row.original.ltv)}</div>
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
    ],
    [],
  );

  const pageCount = Math.max(1, Math.ceil((data?.total ?? 0) / perPage));

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="CRM Members"
          description={`Member registered dengan stats orders + LTV. ${data?.total ?? 0} total. Voucher giving + upgrade path deferred.`}
        />

        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Cari member..."
          className="sm:max-w-sm"
        />

        <DataTable
          columns={columns}
          data={data?.data ?? []}
          isLoading={isLoading}
          isError={isError}
          emptyMessage="Belum ada member."
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

export default CrmMemberListPage;
