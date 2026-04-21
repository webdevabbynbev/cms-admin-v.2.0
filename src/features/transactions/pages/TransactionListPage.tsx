import { useState } from 'react';

import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

import { TransactionListTable } from '../components';
import { useTransactions } from '../hooks';

const DEFAULT_PER_PAGE = 10;

const STATUS_OPTIONS = [
  { value: 'all', label: 'Semua Status' },
  { value: '1', label: 'Belum Bayar' },
  { value: '5', label: 'Sudah Bayar' },
  { value: '2', label: 'Packing' },
  { value: '3', label: 'Dikirim' },
  { value: '4', label: 'Selesai' },
  { value: '6', label: 'Diterima' },
  { value: '9', label: 'Dibatalkan' },
];

const TransactionListPage = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

  const { data, isLoading, isError } = useTransactions({
    transactionNumber: search.trim() || undefined,
    transactionStatus: status === 'all' ? undefined : status,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    perPage,
  });

  const handleReset = () => {
    setSearch('');
    setStatus('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="Transaksi"
          description={`Daftar transaksi. ${data?.total ?? 0} total.`}
        />

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">No. Transaksi</Label>
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari no. transaksi..."
              className="w-56"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Dari Tanggal</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-40"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Sampai Tanggal</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-40"
            />
          </div>

          {(search || status !== 'all' || startDate || endDate) ? (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Reset
            </Button>
          ) : null}
        </div>

        <TransactionListTable
          data={data?.data ?? []}
          total={data?.total ?? 0}
          isLoading={isLoading}
          isError={isError}
          page={page}
          perPage={perPage}
          onPaginationChange={({ page: p, perPage: pp }) => {
            setPage(p);
            setPerPage(pp);
          }}
        />
      </PageContainer>
    </AppShell>
  );
};

export default TransactionListPage;
