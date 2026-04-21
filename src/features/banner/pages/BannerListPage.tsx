import { useState } from 'react';
import { Plus, Search, X } from 'lucide-react';

import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { BannerForm, BannerListTable } from '../components';
import { useBanners } from '../hooks';
import type { Banner } from '../types';

const DEFAULT_PER_PAGE = 10;

const BannerListPage = () => {
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(DEFAULT_PER_PAGE);
  const [formOpen, setFormOpen] = useState<boolean>(false);
  const [editing, setEditing] = useState<Banner | null>(null);

  const { data, isLoading, isError } = useBanners({
    name: search.trim() || undefined,
    page,
    perPage,
  });

  const handleAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEdit = (banner: Banner) => {
    setEditing(banner);
    setFormOpen(true);
  };

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="Banners"
          description={`Manage homepage and promotional banners. ${data?.total ?? 0} total.`}
          actions={
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4" />
              Add Banner
            </Button>
          }
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          {search ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          ) : null}
        </div>

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
          onEdit={handleEdit}
        />

        <BannerForm open={formOpen} onOpenChange={setFormOpen} banner={editing} />
      </PageContainer>
    </AppShell>
  );
};

export default BannerListPage;
