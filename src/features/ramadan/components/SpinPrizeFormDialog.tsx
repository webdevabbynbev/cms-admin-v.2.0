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
  defaultSpinPrizeFormValues,
  spinPrizeFormSchema,
  type SpinPrizeFormValues,
} from '../schemas';
import {
  useCreateRamadanSpinPrize,
  useUpdateRamadanSpinPrize,
} from '../hooks';
import type { RamadanSpinPrize } from '../types';

interface SpinPrizeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spinPrize: RamadanSpinPrize | null;
}

const SpinPrizeFormDialogComponent = ({
  open,
  onOpenChange,
  spinPrize,
}: SpinPrizeFormDialogProps) => {
  const isEdit = Boolean(spinPrize);
  const { mutateAsync: createPrize } = useCreateRamadanSpinPrize();
  const { mutateAsync: updatePrize } = useUpdateRamadanSpinPrize();

  const form = useForm<SpinPrizeFormValues>({
    resolver: zodResolver(spinPrizeFormSchema) as Resolver<SpinPrizeFormValues>,
    defaultValues: defaultSpinPrizeFormValues,
    mode: 'onBlur',
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      spinPrize
        ? {
            name: spinPrize.name,
            weight: spinPrize.weight,
            isGrand: spinPrize.isGrand,
            isActive: spinPrize.isActive,
            dailyQuota: spinPrize.dailyQuota,
            voucherId: spinPrize.voucherId,
            voucherQty: spinPrize.voucherQty,
          }
        : defaultSpinPrizeFormValues,
    );
  }, [open, spinPrize, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        name: values.name.trim(),
        weight: values.weight,
        is_grand: values.isGrand,
        is_active: values.isActive,
        daily_quota: values.dailyQuota,
        voucher_id: values.voucherId,
        voucher_qty: values.voucherQty,
      };
      if (isEdit && spinPrize) {
        await updatePrize({ id: spinPrize.id, payload });
        toast.success('Hadiah spin berhasil diupdate');
      } else {
        await createPrize(payload);
        toast.success('Hadiah spin berhasil dibuat');
      }
      onOpenChange(false);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal menyimpan hadiah');
      toast.error(msg);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Hadiah Spin' : 'Tambah Hadiah Spin'}</DialogTitle>
          <DialogDescription>
            Hadiah untuk spin wheel event Ramadhan. Weight menentukan probabilitas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sp-name">Nama Hadiah</Label>
            <Input id="sp-name" {...form.register('name')} />
            {form.formState.errors.name ? (
              <span className="text-xs text-error">
                {form.formState.errors.name.message}
              </span>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sp-weight">Weight (probabilitas)</Label>
              <Input
                id="sp-weight"
                type="number"
                min={1}
                {...form.register('weight', { valueAsNumber: true })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sp-quota">Daily Quota (opsional)</Label>
              <Input
                id="sp-quota"
                type="number"
                min={0}
                value={form.watch('dailyQuota') ?? ''}
                onChange={(e) =>
                  form.setValue(
                    'dailyQuota',
                    e.target.value === '' ? null : Number(e.target.value),
                  )
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sp-voucher">Voucher ID (opsional)</Label>
              <Input
                id="sp-voucher"
                type="number"
                min={1}
                value={form.watch('voucherId') ?? ''}
                onChange={(e) =>
                  form.setValue(
                    'voucherId',
                    e.target.value === '' ? null : Number(e.target.value),
                  )
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sp-vqty">Voucher Qty</Label>
              <Input
                id="sp-vqty"
                type="number"
                min={1}
                {...form.register('voucherQty', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <Label className="text-sm">Grand Prize</Label>
              <Switch
                checked={form.watch('isGrand')}
                onCheckedChange={(v) => form.setValue('isGrand', v)}
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

export const SpinPrizeFormDialog = memo(SpinPrizeFormDialogComponent);
