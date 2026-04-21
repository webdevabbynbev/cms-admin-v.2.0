import { useState } from 'react';
import { Plus } from 'lucide-react';

import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
  ProfileCategoryOptionFormDialog,
  ProfileCategoryOptionListTable,
} from '../components';
import { useProfileCategoryOptions } from '../hooks';
import type { ProfileCategoryOption } from '../types';

const DEFAULT_PER_PAGE = 10;

const ProfileCategoryOptionListPage = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProfileCategoryOption | null>(null);

  const { data, isLoading, isError } = useProfileCategoryOptions({
    q: search.trim() || undefined,
    page,
    perPage,
  });

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="Profile Category Options"
          description={`Option di bawah profile category. ${data?.total ?? 0} total.`}
          actions={
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Tambah Option
            </Button>
          }
        />

        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Cari option..."
          className="sm:max-w-sm"
        />

        <ProfileCategoryOptionListTable
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
          onEdit={(option) => {
            setEditing(option);
            setDialogOpen(true);
          }}
        />

        <ProfileCategoryOptionFormDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditing(null);
          }}
          option={editing}
        />
      </PageContainer>
    </AppShell>
  );
};

export default ProfileCategoryOptionListPage;
