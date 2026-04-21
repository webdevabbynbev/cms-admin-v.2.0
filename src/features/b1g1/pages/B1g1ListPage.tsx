import { useState } from 'react';
import { Plus } from 'lucide-react';

import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { B1g1FormDialog, B1g1ListTable } from '../components';
import { useB1g1List } from '../hooks';
import type { B1g1 } from '../types';

const DEFAULT_PER_PAGE = 10;

const B1g1ListPage = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<B1g1 | null>(null);

  const { data, isLoading, isError } = useB1g1List({
    q: search.trim() || undefined,
    page,
    perPage,
  });

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="B1G1 (Buy One Get One)"
          description={`Promo beli satu gratis satu. ${data?.total ?? 0} total.`}
          actions={
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Tambah B1G1
            </Button>
          }
        />

        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Cari B1G1..."
          className="sm:max-w-sm"
        />

        <B1g1ListTable
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
          onEdit={(b1g1) => {
            setEditing(b1g1);
            setDialogOpen(true);
          }}
        />

        <B1g1FormDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditing(null);
          }}
          b1g1={editing}
        />
      </PageContainer>
    </AppShell>
  );
};

export default B1g1ListPage;
