import { useState } from 'react';
import { Plus } from 'lucide-react';

import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { GiftFormDialog, GiftListTable } from '../components';
import { useGifts } from '../hooks';
import type { GiftProduct } from '../types';

const DEFAULT_PER_PAGE = 10;

const GiftListPage = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GiftProduct | null>(null);

  const { data, isLoading, isError } = useGifts({
    q: search.trim() || undefined,
    page,
    perPage,
  });

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="Gift Products"
          description={`Produk hadiah untuk promo. ${data?.total ?? 0} total.`}
          actions={
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Tambah Gift
            </Button>
          }
        />

        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Cari gift..."
          className="sm:max-w-sm"
        />

        <GiftListTable
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
          onEdit={(gift) => {
            setEditing(gift);
            setDialogOpen(true);
          }}
        />

        <GiftFormDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditing(null);
          }}
          gift={editing}
        />
      </PageContainer>
    </AppShell>
  );
};

export default GiftListPage;
