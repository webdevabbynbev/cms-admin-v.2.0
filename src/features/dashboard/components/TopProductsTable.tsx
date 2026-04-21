import { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowRight } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/common/DataTable';
import { formatNumber } from '../utils/format';
import { useTopProducts } from '../hooks';
import type { ProductSummary } from '../types';

const TopProductsTableComponent = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useTopProducts();

  const columns = useMemo<ColumnDef<ProductSummary>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Product Name',
        cell: ({ row }) => (
          <button
            type="button"
            className="block max-w-full truncate text-left text-interactive hover:underline"
            title={row.original.name}
            onClick={() => navigate(`/product-form?id=${row.original.id}`)}
          >
            {row.original.name}
          </button>
        ),
      },
      {
        accessorKey: 'total',
        header: () => <div className="text-right">Sold</div>,
        cell: ({ row }) => (
          <div className="text-right font-medium">{formatNumber(row.original.total)}</div>
        ),
      },
    ],
    [navigate],
  );

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base font-semibold">Top Products</CardTitle>
        <Button variant="link" size="sm" onClick={() => navigate('/reports/sales')}>
          Detail <ArrowRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={data ?? []}
          isLoading={isLoading}
          isError={isError}
          emptyMessage="No products sold yet"
          pageSize={5}
        />
      </CardContent>
    </Card>
  );
};

export const TopProductsTable = memo(TopProductsTableComponent);
