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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

import {
  defaultNedFormValues,
  nedFormSchema,
  type NedFormValues,
} from '../schemas';
import { useCreateNed, useUpdateNed } from '../hooks';
import type { Ned } from '../types';

interface NedFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ned: Ned | null;
}

const NedFormDialogComponent = ({ open, onOpenChange, ned }: NedFormDialogProps) => {
  const isEdit = Boolean(ned);
  const { mutateAsync: createNed } = useCreateNed();
  const { mutateAsync: updateNed } = useUpdateNed();

  const form = useForm<NedFormValues>({
    resolver: zodResolver(nedFormSchema) as Resolver<NedFormValues>,
    defaultValues: defaultNedFormValues,
    mode: 'onBlur',
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      ned
        ? {
            name: ned.name,
            description: ned.description ?? '',
            sku: ned.sku ?? '',
            price: ned.price,
            quantity: ned.quantity,
            isActive: ned.isActive,
            isVisibleEcommerce: ned.isVisibleEcommerce,
            isVisiblePos: ned.isVisiblePos,
          }
        : defaultNedFormValues,
    );
  }, [open, ned, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        name: values.name.trim(),
        description: values.description?.trim() || null,
        sku: values.sku?.trim() || null,
        price: values.price,
        quantity: values.quantity,
        is_active: values.isActive,
        is_visible_ecommerce: values.isVisibleEcommerce,
        is_visible_pos: values.isVisiblePos,
      };
      if (isEdit && ned) {
        await updateNed({ id: ned.id, payload });
        toast.success('NED berhasil diupdate');
      } else {
        await createNed(payload);
        toast.success('NED berhasil dibuat');
      }
      onOpenChange(false);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal menyimpan NED');
      toast.error(msg);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit NED' : 'Tambah NED'}</DialogTitle>
          <DialogDescription>
            Near Expired Date promo. Item-level mapping di-defer; hanya edit metadata.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ned-name">Nama</Label>
              <Input id="ned-name" {...form.register('name')} />
              {form.formState.errors.name ? (
                <span className="text-xs text-error">
                  {form.formState.errors.name.message}
                </span>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ned-sku">SKU</Label>
              <Input id="ned-sku" {...form.register('sku')} placeholder="opsional" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ned-desc">Deskripsi</Label>
            <Textarea id="ned-desc" {...form.register('description')} rows={3} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ned-price">Harga</Label>
              <Input
                id="ned-price"
                type="number"
                min={0}
                value={form.watch('price') ?? ''}
                onChange={(e) =>
                  form.setValue(
                    'price',
                    e.target.value === '' ? null : Number(e.target.value),
                  )
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ned-qty">Quantity</Label>
              <Input
                id="ned-qty"
                type="number"
                min={0}
                value={form.watch('quantity') ?? ''}
                onChange={(e) =>
                  form.setValue(
                    'quantity',
                    e.target.value === '' ? null : Number(e.target.value),
                  )
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <Label className="text-sm">Aktif</Label>
              <Switch
                checked={form.watch('isActive')}
                onCheckedChange={(v) => form.setValue('isActive', v)}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <Label className="text-sm">Visible E-commerce</Label>
              <Switch
                checked={form.watch('isVisibleEcommerce')}
                onCheckedChange={(v) => form.setValue('isVisibleEcommerce', v)}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <Label className="text-sm">Visible POS</Label>
              <Switch
                checked={form.watch('isVisiblePos')}
                onCheckedChange={(v) => form.setValue('isVisiblePos', v)}
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

export const NedFormDialog = memo(NedFormDialogComponent);
