import { memo, useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

import {
  defaultGiftFormValues,
  giftFormSchema,
  type GiftFormValues,
} from '../schemas';
import { useCreateGift, useUpdateGift } from '../hooks';
import type { GiftProduct } from '../types';

interface GiftFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gift: GiftProduct | null;
}

const GiftFormDialogComponent = ({ open, onOpenChange, gift }: GiftFormDialogProps) => {
  const isEdit = Boolean(gift);
  const { mutateAsync: createGift } = useCreateGift();
  const { mutateAsync: updateGift } = useUpdateGift();

  const form = useForm<GiftFormValues>({
    resolver: zodResolver(giftFormSchema) as Resolver<GiftFormValues>,
    defaultValues: defaultGiftFormValues,
    mode: 'onBlur',
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      gift
        ? {
            productName: gift.productName,
            brandName: gift.brandName ?? '',
            variantName: gift.variantName ?? '',
            productVariantSku: gift.productVariantSku ?? '',
            price: gift.price,
            stock: gift.stock,
            weight: gift.weight,
            imageUrl: gift.imageUrl ?? '',
            isSellable: gift.isSellable,
            isActive: gift.isActive,
          }
        : defaultGiftFormValues,
    );
  }, [open, gift, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        brand_id: gift?.brandId ?? null,
        brand_name: values.brandName?.trim() || null,
        product_name: values.productName.trim(),
        variant_name: values.variantName?.trim() || null,
        product_variant_sku: values.productVariantSku?.trim() || null,
        product_variant_id: gift?.productVariantId ?? null,
        is_sellable: values.isSellable,
        price: values.price,
        stock: values.stock,
        weight: values.weight,
        image_url: values.imageUrl?.trim() || null,
        is_active: values.isActive,
      };
      if (isEdit && gift) {
        await updateGift({ id: gift.id, payload });
        toast.success('Gift berhasil diupdate');
      } else {
        await createGift(payload);
        toast.success('Gift berhasil dibuat');
      }
      onOpenChange(false);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal menyimpan gift');
      toast.error(msg);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Gift' : 'Tambah Gift'}</DialogTitle>
          <DialogDescription>Produk hadiah untuk flash sale / voucher.</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="gift-name">Nama Produk</Label>
              <Input id="gift-name" {...form.register('productName')} />
              {form.formState.errors.productName ? (
                <span className="text-xs text-error">
                  {form.formState.errors.productName.message}
                </span>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="gift-brand">Brand (nama)</Label>
              <Input id="gift-brand" {...form.register('brandName')} placeholder="opsional" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="gift-variant">Nama Varian</Label>
              <Input id="gift-variant" {...form.register('variantName')} placeholder="opsional" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="gift-sku">SKU Varian</Label>
              <Input id="gift-sku" {...form.register('productVariantSku')} placeholder="opsional" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="gift-price">Harga</Label>
              <Input
                id="gift-price"
                type="number"
                min={0}
                {...form.register('price', { valueAsNumber: true })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="gift-stock">Stok</Label>
              <Input
                id="gift-stock"
                type="number"
                min={0}
                {...form.register('stock', { valueAsNumber: true })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="gift-weight">Berat (gram)</Label>
              <Input
                id="gift-weight"
                type="number"
                min={0}
                {...form.register('weight', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="gift-image">Image URL</Label>
            <Input
              id="gift-image"
              {...form.register('imageUrl')}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <Label className="text-sm">Bisa Dijual</Label>
              <Switch
                checked={form.watch('isSellable')}
                onCheckedChange={(v) => form.setValue('isSellable', v)}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <Label className="text-sm">Status Aktif</Label>
              <Switch
                checked={form.watch('isActive')}
                onCheckedChange={(v) => form.setValue('isActive', v)}
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
              {isEdit ? 'Simpan' : 'Buat'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const GiftFormDialog = memo(GiftFormDialogComponent);
