import { useState } from 'react';
import { Plus } from 'lucide-react';

import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';

import { BannerFormDialog, BannerListTable } from '../components';
import { useRamadanBanners } from '../hooks';
import type { RamadanRecommendationBanner } from '../types';

const DEFAULT_PER_PAGE = 10;

const RamadanBannerListPage = () => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RamadanRecommendationBanner | null>(null);

  const { data, isLoading, isError } = useRamadanBanners({ page, perPage });

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="Ramadan Banners"
          description={`Banner harian Ramadhan. ${data?.total ?? 0} total.`}
          actions={
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Tambah Banner
            </Button>
          }
        />

        <BannerListTable
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
          onEdit={(banner) => {
            setEditing(banner);
            setDialogOpen(true);
          }}
        />

        <BannerFormDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditing(null);
          }}
          banner={editing}
        />
      </PageContainer>
    </AppShell>
  );
};

export default RamadanBannerListPage;
