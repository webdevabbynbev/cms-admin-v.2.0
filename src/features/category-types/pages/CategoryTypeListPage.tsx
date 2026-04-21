import { useState } from 'react';
import { Plus } from 'lucide-react';

import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { CategoryTypeFormDialog, CategoryTypeListTable } from '../components';
import { useCategoryTypes } from '../hooks';
import type { CategoryType } from '../types';

const DEFAULT_PER_PAGE = 10;

const CategoryTypeListPage = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryType | null>(null);

  const { data, isLoading, isError } = useCategoryTypes({
    q: search.trim() || undefined,
    page,
    perPage,
  });

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="Category Types"
          description={`Kategori produk (dengan tree parent). ${data?.total ?? 0} total.`}
          actions={
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Tambah Category
            </Button>
          }
        />

        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Cari kategori..."
          className="sm:max-w-sm"
        />

        <CategoryTypeListTable
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
          onEdit={(categoryType) => {
            setEditing(categoryType);
            setDialogOpen(true);
          }}
        />

        <CategoryTypeFormDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditing(null);
          }}
          categoryType={editing}
        />
      </PageContainer>
    </AppShell>
  );
};

export default CategoryTypeListPage;
