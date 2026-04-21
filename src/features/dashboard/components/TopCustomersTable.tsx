import { memo, useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/common/DataTable';
import { formatIdr, formatNumber } from '../utils/format';
import { useDashboardStats } from '../hooks';
import type { TopCustomer } from '../types';

const TopCustomersTableComponent = () => {
  const { data, isLoading, isError } = useDashboardStats();

  const columns = useMemo<ColumnDef<TopCustomer>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Customer',
        cell: ({ row }) => (
          <span className="block max-w-full truncate font-medium" title={row.original.name}>
            {row.original.name}
          </span>
        ),
      },
      {
        accessorKey: 'total_orders',
        header: () => <div className="text-right">Orders</div>,
        cell: ({ row }) => (
          <div className="text-right">{formatNumber(row.original.total_orders)}</div>
        ),
      },
      {
        accessorKey: 'total_spent',
        header: () => <div className="text-right">Total Spent</div>,
        cell: ({ row }) => (
          <div className="text-right font-medium">{formatIdr(row.original.total_spent)}</div>
        ),
      },
    ],
    [],
  );

  const customers = data?.top_customers ?? [];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Top Customers</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={customers}
          isLoading={isLoading}
          isError={isError}
          emptyMessage="No customers yet"
          pageSize={5}
        />
      </CardContent>
    </Card>
  );
};

export const TopCustomersTable = memo(TopCustomersTableComponent);
