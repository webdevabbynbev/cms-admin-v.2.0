import { memo, useState } from 'react';
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
import {
  useDiscountBrandOptions,
  useDiscountProductOptions,
  useDiscountVariantOptions,
} from '@/features/discounts/hooks';
import { VoucherScopeType } from '../../types';

interface VoucherScopePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scopeType: VoucherScopeType;
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

const PAGE_SIZE = 20;

const VoucherScopePickerDialogComponent = ({
  open,
  onOpenChange,
  scopeType,
  selectedIds,
  onChange,
}: VoucherScopePickerDialogProps) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [local, setLocal] = useState<number[]>(selectedIds);

  const enabled = open && scopeType !== VoucherScopeType.All;

  const variantQuery = useDiscountVariantOptions(
    { q: search || undefined, page, perPage: PAGE_SIZE },
    enabled && scopeType === VoucherScopeType.Variant,
  );
  const productQuery = useDiscountProductOptions(
    { q: search || undefined, page, perPage: PAGE_SIZE },
    enabled && scopeType === VoucherScopeType.Product,
  );
  const brandQuery = useDiscountBrandOptions(
    { q: search || undefined, page, perPage: PAGE_SIZE },
    enabled && scopeType === VoucherScopeType.Brand,
  );

  const activeQuery =
    scopeType === VoucherScopeType.Variant
      ? variantQuery
      : scopeType === VoucherScopeType.Product
        ? productQuery
        : brandQuery;

  const rows = (activeQuery.data?.data ?? []) as Array<{
    id: number;
    name?: string;
    productName?: string;
    sku?: string | null;
    label?: string | null;
  }>;

  const toggle = (id: number) => {
    setLocal((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleSave = () => {
    onChange(local);
    onOpenChange(false);
  };

  const handleClose = (next: boolean) => {
    if (!next) {
      setLocal(selectedIds);
      setSearch('');
      setPage(1);
    }
    onOpenChange(next);
  };

  const titleMap: Record<Exclude<VoucherScopeType, VoucherScopeType.All>, string> = {
    [VoucherScopeType.Product]: 'Pilih Produk',
    [VoucherScopeType.Variant]: 'Pilih Varian',
    [VoucherScopeType.Brand]: 'Pilih Brand',
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[80vh] overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {titleMap[scopeType as Exclude<VoucherScopeType, VoucherScopeType.All>] ??
              'Pilih Item'}
          </DialogTitle>
          <DialogDescription>
            Pilih item yang bisa mendapat voucher ini
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
              placeholder="Cari..."
              className="pl-9"
            />
          </div>

          <div className="max-h-[50vh] overflow-auto rounded-md border border-border">
            {activeQuery.isFetching ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : rows.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Tidak ada item ditemukan
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {rows.map((item) => {
                  const checked = local.includes(item.id);
                  return (
                    <li key={item.id} className="flex items-center gap-3 p-3">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggle(item.id)}
                      />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium">
                          {item.name ?? item.productName ?? 'Unnamed'}
                        </span>
                        {item.sku ?? item.label ? (
                          <span className="truncate text-xs text-muted-foreground">
                            {item.sku ?? item.label}
                          </span>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {activeQuery.data ? (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Hal {activeQuery.data.currentPage} dari {activeQuery.data.lastPage} • {activeQuery.data.total} total
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activeQuery.data.currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activeQuery.data.currentPage >= activeQuery.data.lastPage}
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
          <Button onClick={handleSave}>Simpan ({local.length})</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const VoucherScopePickerDialog = memo(VoucherScopePickerDialogComponent);
