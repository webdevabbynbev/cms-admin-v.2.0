import { memo, useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import moment from 'moment-timezone';
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
import { WIB_TZ } from '@/utils/timezone';

import {
  defaultB1g1FormValues,
  b1g1FormSchema,
  type B1g1FormValues,
} from '../schemas';
import { useCreateB1g1, useUpdateB1g1 } from '../hooks';
import type { B1g1 } from '../types';

interface B1g1FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  b1g1: B1g1 | null;
}

function isoToLocal(iso: string | null): string {
  if (!iso) return '';
  return moment.tz(iso, WIB_TZ).format('YYYY-MM-DDTHH:mm');
}

function localToIso(value: string): string | null {
  if (!value) return null;
  return moment.tz(value, 'YYYY-MM-DDTHH:mm', WIB_TZ).toISOString();
}

const B1g1FormDialogComponent = ({ open, onOpenChange, b1g1 }: B1g1FormDialogProps) => {
  const isEdit = Boolean(b1g1);
  const { mutateAsync: createB1g1 } = useCreateB1g1();
  const { mutateAsync: updateB1g1 } = useUpdateB1g1();

  const form = useForm<B1g1FormValues>({
    resolver: zodResolver(b1g1FormSchema) as Resolver<B1g1FormValues>,
    defaultValues: defaultB1g1FormValues,
    mode: 'onBlur',
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      b1g1
        ? {
            name: b1g1.name,
            code: b1g1.code,
            description: b1g1.description ?? '',
            isActive: b1g1.isActive,
            isEcommerce: b1g1.isEcommerce,
            isPos: b1g1.isPos,
            applyTo: b1g1.applyTo,
            usageLimit: b1g1.usageLimit,
            minimumPurchase: b1g1.minimumPurchase,
            startedAt: isoToLocal(b1g1.startedAt),
            expiredAt: isoToLocal(b1g1.expiredAt),
          }
        : defaultB1g1FormValues,
    );
  }, [open, b1g1, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        name: values.name.trim(),
        code: values.code.trim(),
        description: values.description?.trim() || null,
        is_active: values.isActive,
        is_ecommerce: values.isEcommerce,
        is_pos: values.isPos,
        apply_to: values.applyTo,
        brand_id: b1g1?.brandId ?? null,
        usage_limit: values.usageLimit,
        minimum_purchase: values.minimumPurchase,
        started_at: localToIso(values.startedAt ?? ''),
        expired_at: localToIso(values.expiredAt ?? ''),
      };
      if (isEdit && b1g1) {
        await updateB1g1({ id: b1g1.id, payload });
        toast.success('B1G1 berhasil diupdate');
      } else {
        await createB1g1(payload);
        toast.success('B1G1 berhasil dibuat');
      }
      onOpenChange(false);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal menyimpan B1G1');
      toast.error(msg);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit B1G1' : 'Tambah B1G1'}</DialogTitle>
          <DialogDescription>
            Buy One Get One promo. Item-level mapping di-defer; hanya edit metadata promo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="b1g1-name">Nama</Label>
              <Input id="b1g1-name" {...form.register('name')} />
              {form.formState.errors.name ? (
                <span className="text-xs text-error">
                  {form.formState.errors.name.message}
                </span>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="b1g1-code">Kode</Label>
              <Input id="b1g1-code" {...form.register('code')} />
              {form.formState.errors.code ? (
                <span className="text-xs text-error">
                  {form.formState.errors.code.message}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="b1g1-desc">Deskripsi</Label>
            <Textarea id="b1g1-desc" {...form.register('description')} rows={3} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="b1g1-apply">Apply To</Label>
              <Input
                id="b1g1-apply"
                {...form.register('applyTo')}
                placeholder="all | brand | product"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="b1g1-limit">Usage Limit</Label>
              <Input
                id="b1g1-limit"
                type="number"
                min={0}
                value={form.watch('usageLimit') ?? ''}
                onChange={(e) =>
                  form.setValue(
                    'usageLimit',
                    e.target.value === '' ? null : Number(e.target.value),
                  )
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="b1g1-min">Min Purchase</Label>
              <Input
                id="b1g1-min"
                type="number"
                min={0}
                value={form.watch('minimumPurchase') ?? ''}
                onChange={(e) =>
                  form.setValue(
                    'minimumPurchase',
                    e.target.value === '' ? null : Number(e.target.value),
                  )
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="b1g1-start">Mulai</Label>
              <Input
                id="b1g1-start"
                type="datetime-local"
                value={form.watch('startedAt') ?? ''}
                onChange={(e) => form.setValue('startedAt', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="b1g1-end">Berakhir</Label>
              <Input
                id="b1g1-end"
                type="datetime-local"
                value={form.watch('expiredAt') ?? ''}
                onChange={(e) => form.setValue('expiredAt', e.target.value)}
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
              <Label className="text-sm">E-commerce</Label>
              <Switch
                checked={form.watch('isEcommerce')}
                onCheckedChange={(v) => form.setValue('isEcommerce', v)}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <Label className="text-sm">POS</Label>
              <Switch
                checked={form.watch('isPos')}
                onCheckedChange={(v) => form.setValue('isPos', v)}
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

export const B1g1FormDialog = memo(B1g1FormDialogComponent);
