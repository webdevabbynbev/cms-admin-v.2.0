import { memo, useMemo, useState } from 'react';
import { Loader2, Search } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useDiscountVariantOptions } from '@/features/discounts/hooks';
import type { FlashSaleVariantFormValues } from '../../schemas';
import { formatFlashSaleCurrency } from '../../utils/formatters';

interface FlashSaleVariantPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingVariantIds: number[];
  onAdd: (items: FlashSaleVariantFormValues[]) => void;
}

const PAGE_SIZE = 20;

const FlashSaleVariantPickerDialogComponent = ({
  open,
  onOpenChange,
  existingVariantIds,
  onAdd,
}: FlashSaleVariantPickerDialogProps) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Record<number, boolean>>({});

  const { data, isFetching } = useDiscountVariantOptions(
    { q: search || undefined, page, perPage: PAGE_SIZE, withVariants: 1 },
    open,
  );

  const existingSet = useMemo(
    () => new Set(existingVariantIds),
    [existingVariantIds],
  );

  const rows = data?.data ?? [];
  const selectedIds = Object.keys(selected)
    .filter((k) => selected[Number(k)])
    .map(Number);

  const toggle = (id: number) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAdd = () => {
    const items: FlashSaleVariantFormValues[] = rows
      .filter((v) => selectedIds.includes(v.id))
      .map((v) => {
        const basePrice = v.price ?? 0;
        const stock = v.stock ?? 0;
        return {
          variantId: v.id,
          productId: v.productId ?? v.product?.id ?? 0,
          productName: v.productName ?? v.product?.name ?? '',
          sku: v.sku ?? null,
          image: null,
          label: v.label ?? '',
          basePrice,
          baseStock: stock,
          flashPrice: basePrice,
          flashStock: stock,
          isActive: true,
        };
      });
    onAdd(items);
    setSelected({});
    onOpenChange(false);
  };

  const handleClose = (next: boolean) => {
    if (!next) {
      setSelected({});
      setSearch('');
      setPage(1);
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[80vh] overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Pilih Varian Flash Sale</DialogTitle>
          <DialogDescription>
            Tambahkan varian satu per satu ke flash sale (bukan per produk).
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari nama produk / SKU..."
              className="pl-9"
            />
          </div>

          <div className="max-h-[50vh] overflow-auto rounded-md border border-border">
            {isFetching ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : rows.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Tidak ada varian ditemukan
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {rows.map((variant) => {
                  const already = existingSet.has(variant.id);
                  const checked = Boolean(selected[variant.id]);
                  return (
                    <li
                      key={variant.id}
                      className={`flex items-center gap-3 p-3 ${already ? 'opacity-50' : ''}`}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => !already && toggle(variant.id)}
                        disabled={already}
                      />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium">
                          {variant.productName ?? variant.product?.name ?? 'Unnamed'}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {variant.sku ?? variant.label ?? ''}
                          {variant.brandName ? ` • ${variant.brandName}` : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {variant.price != null ? (
                          <span className="font-mono text-muted-foreground">
                            {formatFlashSaleCurrency(variant.price)}
                          </span>
                        ) : null}
                        {already ? (
                          <Badge variant="secondary">Sudah dipilih</Badge>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {data ? (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Hal {data.currentPage} dari {data.lastPage} • {data.total} total
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.currentPage >= data.lastPage}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Batal
          </Button>
          <Button onClick={handleAdd} disabled={selectedIds.length === 0}>
            Tambahkan ({selectedIds.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const FlashSaleVariantPickerDialog = memo(FlashSaleVariantPickerDialogComponent);
