import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { AppShell } from '@/layouts';
import { Button } from '@/components/ui/button';
import { PageContainer, PageHeader } from '@/components/common';
import { ProductListFilters, ProductListTable } from '../components';
import type { ProductFilterState } from '../components';
import { useProducts } from '../hooks';
import {
  ProductStatusFilter,
  SeoStatusFilter,
  type ProductListQuery,
} from '../types';
import { hasSeoFilled } from '../utils/format';

const DEFAULT_FILTERS: ProductFilterState = {
  name: '',
  status: ProductStatusFilter.All,
  brandId: null,
  seoStatus: SeoStatusFilter.All,
};

const DEFAULT_PER_PAGE = 10;

const ProductListPage = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ProductFilterState>(DEFAULT_FILTERS);
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(DEFAULT_PER_PAGE);

  const apiFilters = useMemo<ProductListQuery>(() => {
    const base: ProductListQuery = {
      name: filters.name,
      brandId: filters.brandId,
      page,
      perPage,
    };
    if (filters.status === ProductStatusFilter.Draft) {
      base.status = 'draft';
    } else if (filters.status === ProductStatusFilter.Normal) {
      base.status = 'normal';
      base.isFlashsale = false;
    } else if (filters.status === ProductStatusFilter.War) {
      base.isFlashsale = true;
    }
    return base;
  }, [filters, page, perPage]);

  const { data, isLoading, isError } = useProducts(apiFilters);

  const filteredData = useMemo(() => {
    const rows = data?.data ?? [];
    if (filters.seoStatus === SeoStatusFilter.All) return rows;
    const want = filters.seoStatus === SeoStatusFilter.Filled;
    return rows.filter((row) => hasSeoFilled(row) === want);
  }, [data, filters.seoStatus]);

  const total = filters.seoStatus === SeoStatusFilter.All
    ? data?.total ?? 0
    : filteredData.length;

  const handleFiltersChange = (next: ProductFilterState) => {
    setFilters(next);
    setPage(1);
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  const handlePaginationChange = ({
    page: nextPage,
    perPage: nextPerPage,
  }: {
    page: number;
    perPage: number;
  }) => {
    setPage(nextPage);
    setPerPage(nextPerPage);
  };

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="Products"
          description={`Manage your product catalog. ${data?.total ?? 0} total products.`}
          actions={
            <Button onClick={() => navigate('/product-form-new')}>
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          }
        />

        <ProductListFilters value={filters} onChange={handleFiltersChange} onReset={handleReset} />

        <ProductListTable
          data={filteredData}
          total={total}
          isLoading={isLoading}
          isError={isError}
          page={page}
          perPage={perPage}
          onPaginationChange={handlePaginationChange}
        />
      </PageContainer>
    </AppShell>
  );
};

export default ProductListPage;
