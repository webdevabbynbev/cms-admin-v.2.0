import { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/common/DataTable';

import { useAbandonedCarts } from '@/features/abandoned-carts';
import type { AbandonedCart } from '@/features/abandoned-carts';
import { formatIdr } from '../utils/format';

const DASHBOARD_PER_PAGE = 5;

const AbandonedCartTableComponent = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useAbandonedCarts({
    page: 1,
    perPage: DASHBOARD_PER_PAGE,
  });

  const columns = useMemo<ColumnDef<AbandonedCart>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'User',
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium" title={row.original.name}>
              {row.original.name || '-'}
            </span>
            <span
              className="truncate text-xs text-muted-foreground"
              title={row.original.email}
            >
              {row.original.email}
            </span>
          </div>
        ),
      },
      {
        id: 'items',
        header: () => <div className="text-right">Items</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <Badge variant="outline">{row.original.items.length}</Badge>
          </div>
        ),
      },
      {
        accessorKey: 'abandonedValue',
        header: () => <div className="text-right">Value</div>,
        cell: ({ row }) => (
          <div className="text-right text-sm font-medium">
            {formatIdr(row.original.abandonedValue)}
          </div>
        ),
      },
    ],
    [],
  );

  const rows = data?.data ?? [];

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Abandoned Carts</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/abandoned-carts-new')}
          className="gap-1 text-xs"
        >
          Lihat semua
          <ArrowRight className="h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={rows}
          isLoading={isLoading}
          isError={isError}
          emptyMessage="Tidak ada abandoned cart."
          pageSize={DASHBOARD_PER_PAGE}
        />
      </CardContent>
    </Card>
  );
};

export const AbandonedCartTable = memo(AbandonedCartTableComponent);
