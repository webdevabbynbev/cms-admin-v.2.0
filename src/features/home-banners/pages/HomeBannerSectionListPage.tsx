import { useState } from 'react';
import { ArrowUpDown, Plus } from 'lucide-react';

import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';

import {
  HomeBannerSectionFormDialog,
  HomeBannerSectionListTable,
  HomeBannerSectionReorderDialog,
} from '../components';
import { useHomeBannerSections } from '../hooks';
import type { HomeBannerSection } from '../types';

const DEFAULT_PER_PAGE = 10;

const HomeBannerSectionListPage = () => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<HomeBannerSection | null>(null);
  const [reorderOpen, setReorderOpen] = useState(false);

  const { data, isLoading, isError } = useHomeBannerSections({ page, perPage });

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="Home Banner Sections"
          description={`Section grouping untuk banner homepage. ${data?.total ?? 0} total. Per-section banner management di-defer.`}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setReorderOpen(true)}>
                <ArrowUpDown className="h-4 w-4" />
                Atur Urutan
              </Button>
              <Button
                onClick={() => {
                  setEditing(null);
                  setDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Tambah Section
              </Button>
            </div>
          }
        />

        <HomeBannerSectionListTable
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
          onEdit={(section) => {
            setEditing(section);
            setDialogOpen(true);
          }}
        />

        <HomeBannerSectionFormDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditing(null);
          }}
          section={editing}
        />

        <HomeBannerSectionReorderDialog
          open={reorderOpen}
          onOpenChange={setReorderOpen}
        />
      </PageContainer>
    </AppShell>
  );
};

export default HomeBannerSectionListPage;
