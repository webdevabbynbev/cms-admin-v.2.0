import { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/common/DataTable';
import { formatNumber } from '../utils/format';
import { useLeastProducts } from '../hooks';
import type { ProductSummary } from '../types';

const LowStockTableComponent = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useLeastProducts();

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
      <CardHeader>
        <CardTitle className="text-base font-semibold">Low-Performing Products</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={data ?? []}
          isLoading={isLoading}
          isError={isError}
          emptyMessage="No data available"
          pageSize={5}
        />
      </CardContent>
    </Card>
  );
};

export const LowStockTable = memo(LowStockTableComponent);
