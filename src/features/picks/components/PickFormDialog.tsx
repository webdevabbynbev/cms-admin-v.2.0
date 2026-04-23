import { memo, useEffect, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ChevronsUpDown, Check } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

import { axiosClient } from '@/config/axios';
import type { ServeWrapper } from '@/lib/api-types';
import { cn } from '@/lib/utils';
import {
  defaultPicksFormValues,
  picksFormSchema,
  type PicksFormValues,
} from '../schemas';
import { useCreatePick, useUpdatePick } from '../hooks';
import type { PickRecord } from '../types';

interface ProductOption {
  id: number;
  name: string;
  masterSku: string | null;
  brandName: string | null;
}

function useProductSearch(query: string) {
  return useQuery({
    queryKey: ['picks-product-search', query],
    queryFn: async (): Promise<ProductOption[]> => {
      const params = new URLSearchParams({ name: query, page: '1', per_page: '50' });
      const response = await axiosClient.get<ServeWrapper<{ data: unknown[] }>>(
        `/admin/product?${params.toString()}`,
      );
      const list = response.data.serve?.data ?? [];
      return list.map((raw) => {
        const r = raw as Record<string, unknown>;
        const brand = r.brand as Record<string, unknown> | null;
        return {
          id: Number(r.id),
          name: String(r.name ?? ''),
          masterSku: ((r.masterSku ?? r.master_sku) as string | null) ?? null,
          brandName: brand ? String(brand.name ?? '') : null,
        };
      });
    },
    enabled: query.length >= 1,
    staleTime: 30_000,
  });
}

interface PickFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  endpoint: string;
  pick: PickRecord | null;
}

const PickFormDialogComponent = ({
  open,
  onOpenChange,
  endpoint,
  pick,
}: PickFormDialogProps) => {
  const isEdit = Boolean(pick);
  const [productSearch, setProductSearch] = useState('');
  const [productPopoverOpen, setProductPopoverOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(null);

  const { data: productOptions = [], isLoading: isSearching } = useProductSearch(productSearch);

  const { mutateAsync: createPick } = useCreatePick(endpoint);
  const { mutateAsync: updatePick } = useUpdatePick(endpoint);

  const form = useForm<PicksFormValues>({
    resolver: zodResolver(picksFormSchema) as Resolver<PicksFormValues>,
    defaultValues: defaultPicksFormValues,
    mode: 'onBlur',
  });

  useEffect(() => {
    if (!open) return;
    if (pick) {
      form.reset({
        productId: pick.productId,
        order: pick.order,
        isActive: pick.isActive,
        startDate: pick.startDate ?? null,
        endDate: pick.endDate ?? null,
      });
      if (pick.product) {
        setSelectedProduct({
          id: pick.product.id,
          name: pick.product.name,
          masterSku: pick.product.masterSku,
          brandName: pick.product.brandName,
        });
      }
    } else {
      form.reset(defaultPicksFormValues);
      setSelectedProduct(null);
      setProductSearch('');
    }
  }, [open, pick, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (isEdit && pick) {
        await updatePick({
          id: pick.id,
          payload: {
            order: values.order,
            is_active: values.isActive,
            start_date: values.startDate || null,
            end_date: values.endDate || null,
          },
        });
        toast.success('Pick berhasil diupdate');
      } else {
        await createPick({
          product_id: values.productId,
          order: values.order,
          is_active: values.isActive,
          start_date: values.startDate || null,
          end_date: values.endDate || null,
        });
        toast.success('Pick berhasil ditambahkan');
      }
      onOpenChange(false);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal menyimpan pick');
      toast.error(msg);
    }
  });

  const productIdError = form.formState.errors.productId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Pick' : 'Tambah Pick'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {/* Product picker — disabled on edit (API doesn't allow changing product_id) */}
          <div className="flex flex-col gap-1.5">
            <Label>Produk</Label>
            <Popover open={productPopoverOpen} onOpenChange={setProductPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  disabled={isEdit}
                  className={cn(
                    'w-full justify-between',
                    !selectedProduct && 'text-muted-foreground',
                  )}
                >
                  {selectedProduct ? (
                    <span className="truncate text-sm">{selectedProduct.name}</span>
                  ) : (
                    'Cari produk...'
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Ketik nama produk..."
                    value={productSearch}
                    onValueChange={setProductSearch}
                  />
                  <CommandList>
                    {isSearching ? (
                      <CommandEmpty>Mencari...</CommandEmpty>
                    ) : productOptions.length === 0 ? (
                      <CommandEmpty>
                        {productSearch.length >= 1
                          ? 'Produk tidak ditemukan.'
                          : 'Ketik untuk mencari.'}
                      </CommandEmpty>
                    ) : (
                      <CommandGroup>
                        {productOptions.map((p) => (
                          <CommandItem
                            key={p.id}
                            value={String(p.id)}
                            onSelect={() => {
                              setSelectedProduct(p);
                              form.setValue('productId', p.id, { shouldValidate: true });
                              setProductPopoverOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                form.watch('productId') === p.id ? 'opacity-100' : 'opacity-0',
                              )}
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm">{p.name}</p>
                              {p.masterSku ? (
                                <p className="truncate font-mono text-xs text-muted-foreground">
                                  {p.masterSku}
                                  {p.brandName ? ` · ${p.brandName}` : ''}
                                </p>
                              ) : null}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {productIdError ? (
              <span className="text-xs text-destructive">{productIdError.message}</span>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pick-order">Urutan</Label>
              <Input
                id="pick-order"
                type="number"
                min={0}
                value={form.watch('order')}
                onChange={(e) => form.setValue('order', Number(e.target.value))}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <Label className="text-sm">Aktif</Label>
              <Switch
                checked={form.watch('isActive')}
                onCheckedChange={(v) => form.setValue('isActive', v)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pick-start">Mulai Tampil</Label>
              <Input
                id="pick-start"
                type="datetime-local"
                value={form.watch('startDate') ?? ''}
                onChange={(e) =>
                  form.setValue('startDate', e.target.value || null)
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pick-end">Selesai Tampil</Label>
              <Input
                id="pick-end"
                type="datetime-local"
                value={form.watch('endDate') ?? ''}
                onChange={(e) =>
                  form.setValue('endDate', e.target.value || null)
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={form.formState.isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {isEdit ? 'Simpan' : 'Tambah'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const PickFormDialog = memo(PickFormDialogComponent);
