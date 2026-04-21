import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';

import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';
import { DataTable } from '@/components/common/DataTable';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import { useCrmAffiliates } from '../hooks';
import type { CrmAffiliate } from '../types';
import { formatIDR } from '@/features/reports/utils/formatters';

const DEFAULT_PER_PAGE = 10;

const CrmAffiliateListPage = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

  const { data, isLoading, isError } = useCrmAffiliates({
    q: search.trim() || undefined,
    page,
    perPage,
  });

  const columns = useMemo<ColumnDef<CrmAffiliate>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Kode',
        cell: ({ row }) => (
          <span className="font-mono text-sm font-semibold">
            {row.original.code}
          </span>
        ),
      },
      {
        accessorKey: 'discountPercent',
        header: 'Diskon',
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.discountPercent}%</Badge>
        ),
      },
      {
        accessorKey: 'totalRedemptions',
        header: () => <div className="text-right">Redemptions</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm">{row.original.totalRedemptions}</div>
        ),
      },
      {
        accessorKey: 'totalDiscountGiven',
        header: () => <div className="text-right">Diskon Diberikan</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm">
            {formatIDR(row.original.totalDiscountGiven)}
          </div>
        ),
      },
      {
        accessorKey: 'komisiEarned',
        header: () => <div className="text-right">Komisi</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm">
            {formatIDR(row.original.komisiEarned)}
          </div>
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
          title="CRM Affiliates"
          description={`Kode referral affiliate + metrik redemption/komisi. ${data?.total ?? 0} total.`}
        />

        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Cari kode..."
          className="sm:max-w-sm"
        />

        <DataTable
          columns={columns}
          data={data?.data ?? []}
          isLoading={isLoading}
          isError={isError}
          emptyMessage="Belum ada affiliate."
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

export default CrmAffiliateListPage;
