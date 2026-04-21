import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { SaleListTable } from '../components';
import { useSales } from '../hooks';

const DEFAULT_PER_PAGE = 10;

const STATUS_OPTIONS = [
  { value: 'all', label: 'Semua Status' },
  { value: 'running', label: 'Sedang Berjalan' },
  { value: 'upcoming', label: 'Akan Datang' },
  { value: 'ended', label: 'Berakhir' },
  { value: 'inactive', label: 'Nonaktif' },
];

const SaleListPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

  const { data, isLoading, isError } = useSales({
    q: search.trim() || undefined,
    status: status === 'all' ? undefined : status,
    page,
    perPage,
  });

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="Sale Promo"
          description={`Manajemen promo sale. ${data?.total ?? 0} total.`}
          actions={
            <Button onClick={() => navigate('/sales-new/new')}>
              <Plus className="h-4 w-4" />
              Buat Sale
            </Button>
          }
        />

        <div className="flex flex-wrap items-center gap-3">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari judul sale..."
            className="sm:max-w-xs"
          />
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <SaleListTable
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

export default SaleListPage;
