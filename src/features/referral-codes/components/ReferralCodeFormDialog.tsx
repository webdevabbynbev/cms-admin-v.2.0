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
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { WIB_TZ } from '@/utils/timezone';

import {
  defaultReferralCodeFormValues,
  referralCodeFormSchema,
  type ReferralCodeFormValues,
} from '../schemas';
import { useCreateReferralCode, useUpdateReferralCode } from '../hooks';
import type { ReferralCode } from '../types';

interface ReferralCodeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referralCode: ReferralCode | null;
}

function isoToLocal(iso: string | null): string {
  if (!iso) return '';
  return moment.tz(iso, WIB_TZ).format('YYYY-MM-DDTHH:mm');
}

function localToIso(value: string): string | null {
  if (!value) return null;
  return moment.tz(value, 'YYYY-MM-DDTHH:mm', WIB_TZ).toISOString();
}

const ReferralCodeFormDialogComponent = ({
  open,
  onOpenChange,
  referralCode,
}: ReferralCodeFormDialogProps) => {
  const isEdit = Boolean(referralCode);
  const { mutateAsync: createReferralCode } = useCreateReferralCode();
  const { mutateAsync: updateReferralCode } = useUpdateReferralCode();

  const form = useForm<ReferralCodeFormValues>({
    resolver: zodResolver(referralCodeFormSchema) as Resolver<ReferralCodeFormValues>,
    defaultValues: defaultReferralCodeFormValues,
    mode: 'onBlur',
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      referralCode
        ? {
            code: referralCode.code,
            discountPercent: referralCode.discountPercent,
            maxUsesTotal: referralCode.maxUsesTotal,
            isActive: referralCode.isActive,
            startedAt: isoToLocal(referralCode.startedAt),
            expiredAt: isoToLocal(referralCode.expiredAt),
          }
        : defaultReferralCodeFormValues,
    );
  }, [open, referralCode, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        code: values.code.trim().toUpperCase(),
        discount_percent: values.discountPercent,
        max_uses_total: values.maxUsesTotal,
        is_active: values.isActive,
        started_at: localToIso(values.startedAt ?? ''),
        expired_at: localToIso(values.expiredAt ?? ''),
      };
      if (isEdit && referralCode) {
        await updateReferralCode({ id: referralCode.id, payload });
        toast.success('Referral code berhasil diupdate');
      } else {
        await createReferralCode(payload);
        toast.success('Referral code berhasil dibuat');
      }
      onOpenChange(false);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal menyimpan referral code');
      toast.error(msg);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Referral Code' : 'Tambah Referral Code'}
          </DialogTitle>
          <DialogDescription>
            Kode referral untuk diskon otomatis saat pendaftaran/checkout.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rc-code">Kode Referral</Label>
            <Input
              id="rc-code"
              {...form.register('code')}
              placeholder="Contoh: ABBY10"
              className="uppercase"
            />
            {form.formState.errors.code ? (
              <span className="text-xs text-error">
                {form.formState.errors.code.message}
              </span>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rc-pct">Diskon (%)</Label>
              <Input
                id="rc-pct"
                type="number"
                min={1}
                max={100}
                {...form.register('discountPercent', { valueAsNumber: true })}
              />
              {form.formState.errors.discountPercent ? (
                <span className="text-xs text-error">
                  {form.formState.errors.discountPercent.message}
                </span>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rc-qty">Total Qty</Label>
              <Input
                id="rc-qty"
                type="number"
                min={1}
                {...form.register('maxUsesTotal', { valueAsNumber: true })}
              />
              {form.formState.errors.maxUsesTotal ? (
                <span className="text-xs text-error">
                  {form.formState.errors.maxUsesTotal.message}
                </span>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rc-start">Mulai (opsional)</Label>
              <Input
                id="rc-start"
                type="datetime-local"
                value={form.watch('startedAt') ?? ''}
                onChange={(e) => form.setValue('startedAt', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rc-end">Berakhir (opsional)</Label>
              <Input
                id="rc-end"
                type="datetime-local"
                value={form.watch('expiredAt') ?? ''}
                onChange={(e) => form.setValue('expiredAt', e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <Label className="text-sm">Status Aktif</Label>
            <Switch
              checked={form.watch('isActive')}
              onCheckedChange={(v) => form.setValue('isActive', v)}
            />
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

export const ReferralCodeFormDialog = memo(ReferralCodeFormDialogComponent);
