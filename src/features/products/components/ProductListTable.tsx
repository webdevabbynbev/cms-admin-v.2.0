import { memo, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { Copy, ImageOff, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

import { DataTable } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useDeleteProduct } from '../hooks';
import { formatPrice, getProductPrimaryImage, getProductTotalStock, hasSeoFilled } from '../utils/format';
import type { ProductListItem } from '../types';
import { ProductStatus } from '../types';

interface ProductListTableProps {
  data: ProductListItem[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  page: number;
  perPage: number;
  onPaginationChange: (pagination: { page: number; perPage: number }) => void;
}

const statusVariantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  [ProductStatus.Normal]: 'default',
  [ProductStatus.Draft]: 'secondary',
  [ProductStatus.War]: 'destructive',
};

const ProductListTableComponent = ({
  data,
  total,
  isLoading,
  isError,
  page,
  perPage,
  onPaginationChange,
}: ProductListTableProps) => {
  const navigate = useNavigate();
  const [deleteTarget, setDeleteTarget] = useState<ProductListItem | null>(null);
  const { mutateAsync: deleteProduct, isPending: isDeleting } = useDeleteProduct();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProduct(deleteTarget.id);
      toast.success(`Deleted "${deleteTarget.name}"`);
      setDeleteTarget(null);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Failed to delete product');
      toast.error(msg);
    }
  };

  const columns = useMemo<ColumnDef<ProductListItem>[]>(
    () => [
      {
        id: 'image',
        header: '',
        cell: ({ row }) => {
          const image = getProductPrimaryImage(row.original);
          return (
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
              {image ? (
                <img
                  src={image}
                  alt={row.original.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <ImageOff className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <div className="flex min-w-0 max-w-md flex-col">
            <button
              type="button"
              className="truncate text-left text-sm font-medium text-foreground hover:text-interactive hover:underline"
              title={row.original.name}
              onClick={() => navigate(`/product-form?id=${row.original.id}`)}
            >
              {row.original.name}
            </button>
            <span className="truncate text-xs text-muted-foreground">
              {row.original.masterSku}
            </span>
          </div>
        ),
      },
      {
        id: 'brand',
        header: 'Brand',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.brand?.name ?? '—'}
          </span>
        ),
      },
      {
        id: 'price',
        header: () => <div className="text-right">Price</div>,
        cell: ({ row }) => {
          const firstVariant = row.original.variants?.[0];
          const price = firstVariant?.price ?? row.original.priceDisplay ?? 0;
          return <div className="text-right font-medium">{formatPrice(price)}</div>;
        },
      },
      {
        id: 'stock',
        header: () => <div className="text-right">Stock</div>,
        cell: ({ row }) => {
          const stock = getProductTotalStock(row.original);
          return (
            <div
              className={cn(
                'text-right font-medium',
                stock === 0 && 'text-error',
              )}
            >
              {stock}
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status;
          const isFlash = row.original.isFlashSale;
          return (
            <Badge variant={statusVariantMap[status] ?? 'outline'} className="capitalize">
              {isFlash ? 'Flash Sale' : status}
            </Badge>
          );
        },
      },
      {
        id: 'seo',
        header: 'SEO',
        cell: ({ row }) => {
          const filled = hasSeoFilled(row.original);
          return (
            <Badge variant={filled ? 'default' : 'outline'}>
              {filled ? 'Filled' : 'Empty'}
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              title="Edit"
              onClick={() => navigate(`/product-form?id=${row.original.id}`)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              title="Duplicate"
              onClick={() => navigate(`/product-duplicate?id=${row.original.id}`)}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              title="Delete"
              onClick={() => setDeleteTarget(row.original)}
              className="text-error hover:bg-error-bg hover:text-error"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [navigate],
  );

  const pageCount = Math.max(1, Math.ceil(total / perPage));

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="No products found. Try adjusting filters."
        manualPagination
        pageCount={pageCount}
        pagination={{ pageIndex: page - 1, pageSize: perPage }}
        onPaginationChange={(p) =>
          onPaginationChange({ page: p.pageIndex + 1, perPage: p.pageSize })
        }
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete product"
        description={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </>
  );
};

export const ProductListTable = memo(ProductListTableComponent);
