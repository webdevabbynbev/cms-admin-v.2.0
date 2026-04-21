import { useState } from 'react';
import { Plus } from 'lucide-react';

import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { ProfileCategoryFormDialog, ProfileCategoryListTable } from '../components';
import { useProfileCategories } from '../hooks';
import type { ProfileCategory } from '../types';

const DEFAULT_PER_PAGE = 10;

const ProfileCategoryListPage = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProfileCategory | null>(null);

  const { data, isLoading, isError } = useProfileCategories({
    q: search.trim() || undefined,
    page,
    perPage,
  });

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="Profile Category"
          description={`Kategori profil pengguna. ${data?.total ?? 0} total.`}
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
          placeholder="Cari category..."
          className="sm:max-w-sm"
        />

        <ProfileCategoryListTable
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
          onEdit={(category) => {
            setEditing(category);
            setDialogOpen(true);
          }}
        />

        <ProfileCategoryFormDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditing(null);
          }}
          category={editing}
        />
      </PageContainer>
    </AppShell>
  );
};

export default ProfileCategoryListPage;
