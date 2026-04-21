import { useState } from 'react';
import { Plus } from 'lucide-react';

import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { NedFormDialog, NedListTable } from '../components';
import { useNeds } from '../hooks';
import type { Ned } from '../types';

const DEFAULT_PER_PAGE = 10;

const NedListPage = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Ned | null>(null);

  const { data, isLoading, isError } = useNeds({
    q: search.trim() || undefined,
    page,
    perPage,
  });

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="NED (Near Expired Date)"
          description={`Promo produk mendekati expired. ${data?.total ?? 0} total.`}
          actions={
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Tambah NED
            </Button>
          }
        />

        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Cari NED..."
          className="sm:max-w-sm"
        />

        <NedListTable
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
          onEdit={(ned) => {
            setEditing(ned);
            setDialogOpen(true);
          }}
        />

        <NedFormDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditing(null);
          }}
          ned={editing}
        />
      </PageContainer>
    </AppShell>
  );
};

export default NedListPage;
