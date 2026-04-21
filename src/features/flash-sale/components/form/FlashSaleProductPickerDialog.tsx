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
import { useDiscountProductOptions } from '@/features/discounts/hooks';
import type { FlashSaleVariantFormValues } from '../../schemas';

interface FlashSaleProductPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingVariantIds: number[];
  onAdd: (items: FlashSaleVariantFormValues[]) => void;
}

const PAGE_SIZE = 20;

const FlashSaleProductPickerDialogComponent = ({
  open,
  onOpenChange,
  existingVariantIds,
  onAdd,
}: FlashSaleProductPickerDialogProps) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Record<number, boolean>>({});

  const { data, isFetching } = useDiscountProductOptions(
    { q: search || undefined, page, perPage: PAGE_SIZE, withVariants: 1 },
    open,
  );

  const existingSet = useMemo(
    () => new Set(existingVariantIds),
    [existingVariantIds],
  );

  const rows = data?.data ?? [];

  const toggle = (id: number) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedIds = Object.keys(selected)
    .filter((k) => selected[Number(k)])
    .map(Number);

  const handleAdd = () => {
    const items: FlashSaleVariantFormValues[] = [];
    rows
      .filter((p) => selectedIds.includes(p.id))
      .forEach((product) => {
        (product.variants ?? []).forEach((variant) => {
          if (!variant.id || existingSet.has(variant.id)) return;
          const basePrice = variant.price ?? 0;
          items.push({
            variantId: variant.id,
            productId: product.id,
            productName: product.name,
            sku: variant.sku ?? null,
            image: null,
            label: variant.label ?? '',
            basePrice,
            baseStock: variant.stock ?? 0,
            flashPrice: basePrice,
            flashStock: variant.stock ?? 0,
            isActive: true,
          });
        });
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

  const totalVariantsToAdd = rows
    .filter((p) => selectedIds.includes(p.id))
    .reduce(
      (sum, p) =>
        sum +
        (p.variants ?? []).filter(
          (v) => v.id && !existingSet.has(v.id),
        ).length,
      0,
    );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[80vh] overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Pilih Produk Flash Sale</DialogTitle>
          <DialogDescription>
            Semua varian dari produk yang dipilih akan ditambahkan ke flash sale
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
              placeholder="Cari produk..."
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
                Tidak ada produk ditemukan
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {rows.map((product) => {
                  const variantCount = product.variants?.length ?? 0;
                  const checked = Boolean(selected[product.id]);
                  return (
                    <li key={product.id} className="flex items-center gap-3 p-3">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggle(product.id)}
                      />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium">
                          {product.name}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {product.brand?.name ? `${product.brand.name}` : ''}
                        </span>
                      </div>
                      <Badge variant="outline">{variantCount} varian</Badge>
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
          <Button onClick={handleAdd} disabled={totalVariantsToAdd === 0}>
            Tambahkan {totalVariantsToAdd} varian
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const FlashSaleProductPickerDialog = memo(
  FlashSaleProductPickerDialogComponent,
);
