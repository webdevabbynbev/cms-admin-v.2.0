import { memo, useState } from 'react';
import { Loader2, ChevronsUpDown, Check } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import { axiosClient } from '@/config/axios';
import { cn } from '@/lib/utils';
import { useCreateStockAdjustment } from '../hooks';

// ── types ────────────────────────────────────────────────────────────────────
interface ProductOption { id: number; name: string; }
interface VariantOption { id: number; sku: string | null; barcode: string | null; label: string; stock: number; }
interface ServeWrapper<T> { serve: T; }

// ── product search ────────────────────────────────────────────────────────────
function useProductSearch(q: string) {
  return useQuery({
    queryKey: ['adj-product-search', q],
    queryFn: async (): Promise<ProductOption[]> => {
      const params = new URLSearchParams({ name: q, page: '1', per_page: '20' });
      const res = await axiosClient.get<ServeWrapper<{ data: unknown[] }>>(
        `/admin/product?${params.toString()}`,
      );
      return (res.data.serve?.data ?? []).map((r) => {
        const raw = r as Record<string, unknown>;
        return { id: Number(raw.id), name: String(raw.name ?? '') };
      });
    },
    enabled: q.length >= 1,
    staleTime: 30_000,
  });
}

function useProductVariants(productId: number | null) {
  return useQuery({
    queryKey: ['adj-product-variants', productId],
    queryFn: async (): Promise<VariantOption[]> => {
      const res = await axiosClient.get<ServeWrapper<unknown>>(
        `/admin/product/${productId}`,
      );
      const p = res.data.serve as Record<string, unknown>;
      if (!Array.isArray(p.variants)) return [];
      return (p.variants as Record<string, unknown>[]).map((v) => {
        const attrs = Array.isArray(v.attributes) ? v.attributes as Record<string, unknown>[] : [];
        const attrLabel = attrs
          .map((a) => {
            const attr = a.attribute as Record<string, unknown> | null;
            return `${attr?.name ?? ''}: ${a.value}`;
          })
          .join(', ');
        const label =
          ((v.variantLabel ?? v.variant_label ?? v.label) as string | null) ||
          attrLabel ||
          (v.sku as string | null) ||
          String(v.id);
        return {
          id: Number(v.id),
          sku: (v.sku as string | null) ?? null,
          barcode: (v.barcode as string | null) ?? null,
          label,
          stock: Number(v.stock ?? 0),
        };
      });
    },
    enabled: productId !== null,
    staleTime: 60_000,
  });
}

// ── constants ─────────────────────────────────────────────────────────────────
const FROM_LOCATIONS = ['Gudang PRJ', 'Stok Web', 'Supplier'] as const;
const TO_LOCATIONS = ['Gudang PRJ', 'Stok Web', 'Outlet'] as const;
type MovementType = 'transfer_in' | 'transfer_out';

// ── component ─────────────────────────────────────────────────────────────────
interface StockAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const StockAdjustmentDialogComponent = ({ open, onOpenChange }: StockAdjustmentDialogProps) => {
  const { user } = useAuthStore();

  const [productSearch, setProductSearch] = useState('');
  const [productPopoverOpen, setProductPopoverOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [movementType, setMovementType] = useState<MovementType>('transfer_in');
  const [change, setChange] = useState('');
  const [fromLocation, setFromLocation] = useState<string>('Gudang PRJ');
  const [toLocation, setToLocation] = useState<string>('Stok Web');
  const [supplierName, setSupplierName] = useState('');
  const [note, setNote] = useState('');

  const { data: productOptions = [] } = useProductSearch(productSearch);
  const { data: variantOptions = [] } = useProductVariants(selectedProduct?.id ?? null);
  const { mutateAsync: createAdjustment, isPending } = useCreateStockAdjustment();

  const reset = () => {
    setProductSearch('');
    setSelectedProduct(null);
    setSelectedVariantId(null);
    setMovementType('transfer_in');
    setChange('');
    setFromLocation('Gudang PRJ');
    setToLocation('Stok Web');
    setSupplierName('');
    setNote('');
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const buildNote = (): string => {
    const parts = [
      movementType,
      `From: ${fromLocation}`,
      `To: ${toLocation}`,
      `SentBy: ${user?.name ?? 'Admin'}`,
      `SentRole: ${user?.role_name ?? ''}`,
      `SentAt: ${new Date().toISOString()}`,
    ];
    if (fromLocation === 'Supplier' && supplierName) {
      parts.push(`Supplier: ${supplierName}`);
    }
    if (note) parts.push(note);
    return parts.filter(Boolean).join(' | ');
  };

  const handleSubmit = async () => {
    if (!selectedVariantId) {
      toast.error('Pilih produk dan varian terlebih dahulu');
      return;
    }
    const qty = Number(change);
    if (!qty || qty <= 0) {
      toast.error('Jumlah harus lebih dari 0');
      return;
    }
    try {
      const finalChange = movementType === 'transfer_out' ? -qty : qty;
      await createAdjustment({
        variant_id: selectedVariantId,
        change: finalChange,
        note: buildNote(),
      });
      toast.success('Stock adjustment berhasil dibuat');
      handleClose(false);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal membuat adjustment');
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Buat Stock Adjustment</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Product */}
          <div className="flex flex-col gap-1.5">
            <Label>Produk</Label>
            <Popover open={productPopoverOpen} onOpenChange={setProductPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn('w-full justify-between', !selectedProduct && 'text-muted-foreground')}
                >
                  <span className="truncate">{selectedProduct?.name ?? 'Cari produk...'}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[380px] p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Ketik nama produk..."
                    value={productSearch}
                    onValueChange={setProductSearch}
                  />
                  <CommandList>
                    {productOptions.length === 0 ? (
                      <CommandEmpty>
                        {productSearch.length >= 1 ? 'Tidak ditemukan.' : 'Ketik untuk mencari.'}
                      </CommandEmpty>
                    ) : (
                      <CommandGroup>
                        {productOptions.map((p) => (
                          <CommandItem
                            key={p.id}
                            value={String(p.id)}
                            onSelect={() => {
                              setSelectedProduct(p);
                              setSelectedVariantId(null);
                              setProductPopoverOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                selectedProduct?.id === p.id ? 'opacity-100' : 'opacity-0',
                              )}
                            />
                            {p.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Variant */}
          {selectedProduct ? (
            <div className="flex flex-col gap-1.5">
              <Label>Varian</Label>
              <Select
                value={selectedVariantId ? String(selectedVariantId) : undefined}
                onValueChange={(v) => setSelectedVariantId(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih varian..." />
                </SelectTrigger>
                <SelectContent>
                  {variantOptions.map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      {v.label} — stok {v.stock}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            {/* Movement type */}
            <div className="flex flex-col gap-1.5">
              <Label>Tipe Gerakan</Label>
              <Select
                value={movementType}
                onValueChange={(v: MovementType) => setMovementType(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transfer_in">Transfer In (+)</SelectItem>
                  <SelectItem value="transfer_out">Transfer Out (-)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quantity */}
            <div className="flex flex-col gap-1.5">
              <Label>Jumlah</Label>
              <Input
                type="number"
                min={1}
                value={change}
                onChange={(e) => setChange(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Dari</Label>
              <Select value={fromLocation} onValueChange={setFromLocation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FROM_LOCATIONS.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Ke</Label>
              <Select value={toLocation} onValueChange={setToLocation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TO_LOCATIONS.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {fromLocation === 'Supplier' ? (
            <div className="flex flex-col gap-1.5">
              <Label>Nama Supplier</Label>
              <Input
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="PT. Contoh Supplier"
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <Label>Catatan (opsional)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={isPending}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const StockAdjustmentDialog = memo(StockAdjustmentDialogComponent);
