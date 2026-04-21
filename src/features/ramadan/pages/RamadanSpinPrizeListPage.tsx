import { useState } from 'react';
import { Plus } from 'lucide-react';

import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';

import { SpinPrizeFormDialog, SpinPrizeListTable } from '../components';
import { useRamadanSpinPrizes } from '../hooks';
import type { RamadanSpinPrize } from '../types';

const DEFAULT_PER_PAGE = 10;

const RamadanSpinPrizeListPage = () => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RamadanSpinPrize | null>(null);

  const { data, isLoading, isError } = useRamadanSpinPrizes({ page, perPage });

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="Ramadan Spin Prize"
          description={`Hadiah spin wheel. ${data?.total ?? 0} total.`}
          actions={
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Tambah Hadiah
            </Button>
          }
        />

        <SpinPrizeListTable
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
          onEdit={(spinPrize) => {
            setEditing(spinPrize);
            setDialogOpen(true);
          }}
        />

        <SpinPrizeFormDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditing(null);
          }}
          spinPrize={editing}
        />
      </PageContainer>
    </AppShell>
  );
};

export default RamadanSpinPrizeListPage;
