import { useState } from 'react';
import { Plus } from 'lucide-react';

import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { SettingFormDialog, SettingListTable } from '../components';
import { useSettings } from '../hooks';
import type { Setting } from '../types';

const DEFAULT_PER_PAGE = 10;

const SettingListPage = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Setting | null>(null);

  const { data, isLoading, isError } = useSettings({
    name: search.trim() || undefined,
    page,
    perPage,
  });

  const handleAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleEdit = (setting: Setting) => {
    setEditing(setting);
    setDialogOpen(true);
  };

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="Settings"
          description={`Kelola konfigurasi sistem. ${data?.total ?? 0} total.`}
          actions={
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4" />
              Tambah Setting
            </Button>
          }
        />

        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Cari setting..."
          className="sm:max-w-sm"
        />

        <SettingListTable
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

        <SettingFormDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditing(null);
          }}
          setting={editing}
        />
      </PageContainer>
    </AppShell>
  );
};

export default SettingListPage;
