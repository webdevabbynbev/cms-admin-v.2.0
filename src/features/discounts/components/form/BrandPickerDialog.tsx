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
import { toast } from 'sonner';
import {
  useDiscountBrandOptions,
  useDiscountProductOptions,
} from '../../hooks';
import { DiscountItemValueType } from '../../types';
import type { DiscountVariantItemFormValues } from '../../schemas';
import { discountService } from '../../services';

interface BrandPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingVariantIds: number[];
  onAdd: (items: DiscountVariantItemFormValues[]) => void;
}

const PAGE_SIZE = 30;

const BrandPickerDialogComponent = ({
  open,
  onOpenChange,
  existingVariantIds,
  onAdd,
}: BrandPickerDialogProps) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [loadingAdd, setLoadingAdd] = useState(false);

  const { data, isFetching } = useDiscountBrandOptions(
    { q: search || undefined, page, perPage: PAGE_SIZE },
    open,
  );

  useDiscountProductOptions({ loadAll: 0 }, false);

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

  const handleAdd = async () => {
    if (selectedIds.length === 0) return;
    setLoadingAdd(true);
    try {
      const items: DiscountVariantItemFormValues[] = [];
      for (const brandId of selectedIds) {
        const brand = rows.find((b) => b.id === brandId);
        const response = await discountService.getProductOptions({
          brandId,
          withVariants: 1,
          loadAll: 1,
          perPage: 500,
        });
        response.data.forEach((product) => {
          (product.variants ?? []).forEach((variant) => {
            if (existingSet.has(variant.id)) return;
            items.push({
              key: `brand-${brandId}-var-${variant.id}-${Date.now()}`,
              productVariantId: variant.id,
              productId: product.id,
              productName: product.name,
              variantLabel: variant.label ?? '',
              brandId: brandId,
              brandName: brand?.name ?? '',
              sku: variant.sku ?? null,
              basePrice: variant.price ?? null,
              stock: variant.stock ?? null,
              isActive: true,
              valueType: DiscountItemValueType.Percent,
              value: null,
              maxDiscount: null,
              promoStock: null,
              purchaseLimit: null,
            });
          });
        });
      }
      onAdd(items);
      toast.success(`${items.length} varian dari brand ditambahkan`);
      setSelected({});
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Gagal memuat varian brand',
      );
    } finally {
      setLoadingAdd(false);
    }
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
      <DialogContent className="max-h-[80vh] overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pilih Brand</DialogTitle>
          <DialogDescription>
            Semua varian dari brand yang dipilih akan ditambahkan
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
              placeholder="Cari brand..."
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
                Tidak ada brand ditemukan
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {rows.map((brand) => {
                  const checked = Boolean(selected[brand.id]);
                  return (
                    <li key={brand.id} className="flex items-center gap-3 p-3">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggle(brand.id)}
                      />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium">
                          {brand.name}
                        </span>
                        {brand.slug ? (
                          <span className="truncate text-xs text-muted-foreground">
                            {brand.slug}
                          </span>
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
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={loadingAdd}
          >
            Batal
          </Button>
          <Button
            onClick={handleAdd}
            disabled={selectedIds.length === 0 || loadingAdd}
          >
            {loadingAdd ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Tambahkan ({selectedIds.length} brand)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const BrandPickerDialog = memo(BrandPickerDialogComponent);
