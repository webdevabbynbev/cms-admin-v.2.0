import { useState } from 'react';
import { Plus } from 'lucide-react';

import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { ReferralCodeFormDialog, ReferralCodeListTable } from '../components';
import { useReferralCodes } from '../hooks';
import type { ReferralCode } from '../types';

const DEFAULT_PER_PAGE = 10;

const ReferralCodeListPage = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ReferralCode | null>(null);

  const { data, isLoading, isError } = useReferralCodes({
    q: search.trim() || undefined,
    page,
    perPage,
  });

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="Referral Code"
          description={`Kode referral untuk diskon. ${data?.total ?? 0} total.`}
          actions={
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Tambah Referral Code
            </Button>
          }
        />

        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Cari kode..."
          className="sm:max-w-sm"
        />

        <ReferralCodeListTable
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
          onEdit={(referralCode) => {
            setEditing(referralCode);
            setDialogOpen(true);
          }}
        />

        <ReferralCodeFormDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditing(null);
          }}
          referralCode={editing}
        />
      </PageContainer>
    </AppShell>
  );
};

export default ReferralCodeListPage;
