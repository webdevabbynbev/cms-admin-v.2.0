import { useState } from 'react';

import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';
import { Input } from '@/components/ui/input';

import { CustomerListTable } from '../components';
import { useCustomers } from '../hooks';

const DEFAULT_PER_PAGE = 10;

const CustomerListPage = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

  const { data, isLoading, isError } = useCustomers({
    q: search.trim() || undefined,
    page,
    perPage,
  });

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="Customer"
          description={`Daftar customer terdaftar. ${data?.total ?? 0} total.`}
        />

        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Cari nama atau email..."
          className="sm:max-w-sm"
        />

        <CustomerListTable
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

export default CustomerListPage;
