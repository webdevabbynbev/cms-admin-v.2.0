import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';

import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';
import { DataTable } from '@/components/common/DataTable';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import { useAbandonedCarts } from '../hooks';
import type { AbandonedCart } from '../types';
import { formatIDR } from '@/features/reports/utils/formatters';
import { formatCustomerDateTime } from '@/features/customers/utils/formatters';

const DEFAULT_PER_PAGE = 10;

const AbandonedCartListPage = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

  const { data, isLoading, isError } = useAbandonedCarts({
    q: search.trim() || undefined,
    page,
    perPage,
  });

  const columns = useMemo<ColumnDef<AbandonedCart>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'User',
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">
              {row.original.name || '-'}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {row.original.email}
            </span>
          </div>
        ),
      },
      {
        id: 'items',
        header: 'Items',
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.items.length} items</Badge>
        ),
      },
      {
        accessorKey: 'abandonedValue',
        header: () => <div className="text-right">Value</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm font-medium">
            {formatIDR(row.original.abandonedValue)}
          </div>
        ),
      },
      {
        accessorKey: 'ltv',
        header: () => <div className="text-right">LTV</div>,
        cell: ({ row }) => (
          <div className="text-right text-xs text-muted-foreground">
            {formatIDR(row.original.ltv)}
          </div>
        ),
      },
      {
        id: 'lastActivity',
        header: 'Last Activity',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatCustomerDateTime(row.original.lastActivity ?? row.original.updatedAt)}
          </span>
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
          title="Abandoned Cart"
          description={`Cart yang ditinggalkan user. ${data?.total ?? 0} total. Trends chart + recovery actions deferred.`}
        />

        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Cari user..."
          className="sm:max-w-sm"
        />

        <DataTable
          columns={columns}
          data={data?.data ?? []}
          isLoading={isLoading}
          isError={isError}
          emptyMessage="Tidak ada abandoned cart."
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

export default AbandonedCartListPage;
