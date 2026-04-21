import { useState } from 'react';

import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';
import { Input } from '@/components/ui/input';

import { ActivityLogListTable } from '../components';
import { useActivityLogs } from '../hooks';

const DEFAULT_PER_PAGE = 10;

const ActivityLogListPage = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

  const { data, isLoading, isError } = useActivityLogs({
    q: search.trim() || undefined,
    page,
    perPage,
  });

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="Activity Log"
          description={`Riwayat aktivitas admin. ${data?.total ?? 0} total.`}
        />

        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Cari user / aktivitas / modul..."
          className="sm:max-w-sm"
        />

        <ActivityLogListTable
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

export default ActivityLogListPage;
