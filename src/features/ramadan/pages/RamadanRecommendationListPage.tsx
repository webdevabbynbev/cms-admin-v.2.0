import { useState } from 'react';
import { Plus } from 'lucide-react';

import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
  RecommendationFormDialog,
  RecommendationListTable,
} from '../components';
import { useRamadanRecommendations } from '../hooks';
import type { RamadanRecommendation } from '../types';

const DEFAULT_PER_PAGE = 10;

const RamadanRecommendationListPage = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RamadanRecommendation | null>(null);

  const { data, isLoading, isError } = useRamadanRecommendations({
    q: search.trim() || undefined,
    page,
    perPage,
  });

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="Ramadan Recommendations"
          description={`Produk rekomendasi Ramadhan. ${data?.total ?? 0} total.`}
          actions={
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Tambah Recommendation
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

        <RecommendationListTable
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
          onEdit={(rec) => {
            setEditing(rec);
            setDialogOpen(true);
          }}
        />

        <RecommendationFormDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditing(null);
          }}
          recommendation={editing}
        />
      </PageContainer>
    </AppShell>
  );
};

export default RamadanRecommendationListPage;
