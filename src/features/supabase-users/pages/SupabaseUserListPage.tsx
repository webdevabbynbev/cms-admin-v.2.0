import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';

import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';
import { DataTable } from '@/components/common/DataTable';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

import { useSupabaseUsers, useSupabaseUserSummary } from '../hooks';
import type { SupabaseUser } from '../types';
import { formatIDR } from '@/features/reports/utils/formatters';

const DEFAULT_PER_PAGE = 20;

function loyaltySegment(ltv: number): { label: string; variant: 'default' | 'secondary' | 'outline' } {
  if (ltv >= 5_000_000) return { label: 'Big Spender', variant: 'default' };
  if (ltv >= 1_000_000) return { label: 'Loyal', variant: 'secondary' };
  if (ltv > 0) return { label: 'Customer', variant: 'outline' };
  return { label: 'New User', variant: 'outline' };
}

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Tanggal Daftar' },
  { value: 'ltv', label: 'LTV' },
  { value: 'total_orders', label: 'Total Pesanan' },
];

const SupabaseUserListPage = () => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minLtv, setMinLtv] = useState('');
  const [minOrders, setMinOrders] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

  const filters = {
    q: search.trim() || undefined,
    sortBy,
    sortOrder,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    minLtv: minLtv ? Number(minLtv) : undefined,
    minOrders: minOrders ? Number(minOrders) : undefined,
    page,
    perPage,
  };

  const { data, isLoading, isError } = useSupabaseUsers(filters);
  const { data: summary } = useSupabaseUserSummary(filters);

  const handleReset = () => {
    setSearch('');
    setSortBy('created_at');
    setSortOrder('desc');
    setDateFrom('');
    setDateTo('');
    setMinLtv('');
    setMinOrders('');
    setPage(1);
  };

  const columns = useMemo<ColumnDef<SupabaseUser>[]>(
    () => [
      {
        id: 'user',
        header: 'Pelanggan',
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">{row.original.name}</span>
            <span className="truncate text-xs text-muted-foreground">{row.original.email}</span>
            {row.original.phoneNumber ? (
              <span className="text-xs text-muted-foreground">{row.original.phoneNumber}</span>
            ) : null}
          </div>
        ),
      },
      {
        id: 'orders',
        header: () => <div className="text-right">Pesanan</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <Badge variant="outline">{row.original.totalOrders}</Badge>
          </div>
        ),
      },
      {
        id: 'ltv',
        header: () => <div className="text-right">LTV</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm font-medium text-destructive">
            {formatIDR(row.original.ltv)}
          </div>
        ),
      },
      {
        id: 'segment',
        header: 'Segmen',
        cell: ({ row }) => {
          const seg = loyaltySegment(row.original.ltv);
          return <Badge variant={seg.variant}>{seg.label}</Badge>;
        },
      },
      {
        id: 'verified',
        header: 'Email',
        cell: ({ row }) => (
          <Badge variant={row.original.emailVerified ? 'default' : 'outline'}>
            {row.original.emailVerified ? 'Terverifikasi' : 'Belum'}
          </Badge>
        ),
      },
      {
        id: 'joinDate',
        header: 'Bergabung',
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
    ],
    [],
  );

  const pageCount = Math.max(1, Math.ceil((data?.total ?? 0) / perPage));

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="Supabase Users"
          description={`Daftar customer terdaftar. ${data?.total ?? 0} total.`}
        />

        {/* Summary cards */}
        {summary ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Total Users', value: summary.totalUsers.toLocaleString('id-ID') },
              { label: 'Total Transaksi', value: summary.totalTransactions.toLocaleString('id-ID') },
              { label: 'Total Revenue', value: formatIDR(summary.totalRevenue) },
              { label: 'Avg LTV', value: formatIDR(summary.averageLtv) },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-lg border border-border bg-card p-4"
              >
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="mt-1 text-base font-semibold">{card.value}</p>
              </div>
            ))}
          </div>
        ) : null}

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Cari</Label>
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Nama / email / telepon..."
              className="w-56"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Urutkan</Label>
            <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(1); }}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Arah</Label>
            <Select
              value={sortOrder}
              onValueChange={(v: 'asc' | 'desc') => { setSortOrder(v); setPage(1); }}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Terbaru</SelectItem>
                <SelectItem value="asc">Terlama</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Dari</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="w-36"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Sampai</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="w-36"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Min LTV</Label>
            <Input
              type="number"
              value={minLtv}
              onChange={(e) => { setMinLtv(e.target.value); setPage(1); }}
              placeholder="1000000"
              className="w-28"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Min Orders</Label>
            <Input
              type="number"
              value={minOrders}
              onChange={(e) => { setMinOrders(e.target.value); setPage(1); }}
              placeholder="3"
              className="w-24"
            />
          </div>

          {(search || dateFrom || dateTo || minLtv || minOrders) ? (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Reset
            </Button>
          ) : null}
        </div>

        <DataTable
          columns={columns}
          data={data?.data ?? []}
          isLoading={isLoading}
          isError={isError}
          emptyMessage="Tidak ada user."
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

export default SupabaseUserListPage;
