import { useState } from 'react';

import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';
import { Input } from '@/components/ui/input';

import { ParticipantListTable } from '../components';
import { useRamadanParticipants } from '../hooks';

const DEFAULT_PER_PAGE = 10;

const RamadanParticipantListPage = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

  const { data, isLoading, isError } = useRamadanParticipants({
    q: search.trim() || undefined,
    page,
    perPage,
  });

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="Ramadan Participants"
          description={`Peserta event Ramadhan. ${data?.total ?? 0} total. CSV import / prize assignment deferred.`}
        />

        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Cari peserta..."
          className="sm:max-w-sm"
        />

        <ParticipantListTable
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

export default RamadanParticipantListPage;
