import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';

import {
  DiscountFiltersCard,
  DiscountListTable,
  DiscountStatsCards,
} from '../components';
import { useDiscounts } from '../hooks';
import { toDiscountListItem } from '../utils/normalize';
import type { DiscountListItem } from '../types';
import { DiscountActiveFlag, DiscountStatus } from '../types';
import {
  defaultDiscountFilterValues,
  type DiscountFilterValues,
} from '../schemas';
import { isAllProductsDiscount } from '../utils/all-products-marker';

const DEFAULT_PER_PAGE = 10;

const DiscountListPage = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<DiscountFilterValues>(
    defaultDiscountFilterValues,
  );
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(DEFAULT_PER_PAGE);

  const { data, isLoading, isError } = useDiscounts({
    q: filters.search?.trim() || undefined,
    page,
    perPage,
  });

  const listItems = useMemo<DiscountListItem[]>(() => {
    const raw = data?.data ?? [];
    return raw.map(toDiscountListItem).filter((item) => {
      if (filters.status && item.status !== filters.status) return false;
      if (filters.channel === 'ecommerce' && item.isEcommerce !== DiscountActiveFlag.Active) {
        return false;
      }
      if (filters.channel === 'pos' && item.isPos !== DiscountActiveFlag.Active) {
        return false;
      }
      if (filters.scope === 'all_products' && !isAllProductsDiscount(item.description)) {
        return false;
      }
      return true;
    });
  }, [data, filters]);

  const runningOnly = useMemo(
    () =>
      listItems.filter((item) => item.status !== DiscountStatus.Inactive),
    [listItems],
  );

  const handleAdd = () => navigate('/discounts-new/new');
  const handleEdit = (discount: DiscountListItem) => {
    const identifier = discount.id || discount.code;
    navigate(`/discounts-new/${identifier}`);
  };

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="Diskon"
          description={`Kelola promo dan diskon. ${data?.total ?? 0} total.`}
          actions={
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4" />
              Tambah Diskon
            </Button>
          }
        />

        <DiscountStatsCards
          total={data?.total ?? 0}
          items={runningOnly}
        />

        <DiscountFiltersCard
          values={filters}
          onChange={(next) => {
            setFilters(next);
            setPage(1);
          }}
          onReset={() => {
            setFilters(defaultDiscountFilterValues);
            setPage(1);
          }}
        />

        <DiscountListTable
          data={listItems}
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

export default DiscountListPage;
