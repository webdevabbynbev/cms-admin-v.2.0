import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';

import {
  VoucherFiltersCard,
  VoucherListTable,
  VoucherStatsCards,
} from '../components';
import { useVouchers } from '../hooks';
import type { Voucher } from '../types';
import {
  defaultVoucherFilterValues,
  type VoucherFilterValues,
} from '../schemas';

const DEFAULT_PER_PAGE = 10;

const VoucherListPage = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<VoucherFilterValues>(
    defaultVoucherFilterValues,
  );
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(DEFAULT_PER_PAGE);

  const { data, isLoading, isError } = useVouchers({
    name: filters.search?.trim() || undefined,
    type: filters.type,
    rewardType: filters.rewardType,
    page,
    perPage,
  });

  const items = useMemo(() => data?.data ?? [], [data]);

  const handleAdd = () => navigate('/vouchers-new/new');
  const handleEdit = (voucher: Voucher) => {
    navigate(`/vouchers-new/${voucher.id}`);
  };

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="Voucher"
          description={`Kelola voucher promo dan hadiah. ${data?.total ?? 0} total.`}
          actions={
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4" />
              Tambah Voucher
            </Button>
          }
        />

        <VoucherStatsCards total={data?.total ?? 0} items={items} />

        <VoucherFiltersCard
          values={filters}
          onChange={(next) => {
            setFilters(next);
            setPage(1);
          }}
          onReset={() => {
            setFilters(defaultVoucherFilterValues);
            setPage(1);
          }}
        />

        <VoucherListTable
          data={items}
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
      </PageContainer>
    </AppShell>
  );
};

export default VoucherListPage;
