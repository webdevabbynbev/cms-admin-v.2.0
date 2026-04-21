import { useState } from 'react';
import { Plus } from 'lucide-react';

import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { PickListTable, PickFormDialog } from '../components';
import { usePicks } from '../hooks';
import type { PickRecord, PicksType } from '../types';

const DEFAULT_PER_PAGE = 20;

const ENDPOINT_MAP: Record<PicksType, string> = {
  abby: '/admin/abby-picks',
  bev: '/admin/bev-picks',
  top: '/admin/top-picks-promo',
};

const TITLE_MAP: Record<PicksType, string> = {
  abby: 'Abby Picks',
  bev: 'Bev Picks',
  top: 'Top Picks Promo',
};

interface PicksListPageProps {
  picksType: PicksType;
}

const PicksListPage = ({ picksType }: PicksListPageProps) => {
  const endpoint = ENDPOINT_MAP[picksType];
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PickRecord | null>(null);

  const { data, isLoading, isError } = usePicks(endpoint, {
    q: search.trim() || undefined,
    page,
    perPage,
  });

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title={TITLE_MAP[picksType]}
          description={`Kurasi produk pilihan. ${data?.total ?? 0} total. Drag-drop reorder deferred.`}
          actions={
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Tambah Pick
            </Button>
          }
        />

        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Cari produk..."
          className="sm:max-w-sm"
        />

        <PickListTable
          endpoint={endpoint}
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
          onEdit={(pick) => {
            setEditing(pick);
            setDialogOpen(true);
          }}
        />

        <PickFormDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditing(null);
          }}
          endpoint={endpoint}
          pick={editing}
        />
      </PageContainer>
    </AppShell>
  );
};

export default PicksListPage;
