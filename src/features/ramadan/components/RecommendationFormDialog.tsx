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
  defaultRecommendationFormValues,
  recommendationFormSchema,
  type RecommendationFormValues,
} from '../schemas';
import {
  useCreateRamadanRecommendation,
  useUpdateRamadanRecommendation,
} from '../hooks';
import type { RamadanRecommendation } from '../types';

interface RecommendationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recommendation: RamadanRecommendation | null;
}

const RecommendationFormDialogComponent = ({
  open,
  onOpenChange,
  recommendation,
}: RecommendationFormDialogProps) => {
  const isEdit = Boolean(recommendation);
  const { mutateAsync: createRec } = useCreateRamadanRecommendation();
  const { mutateAsync: updateRec } = useUpdateRamadanRecommendation();

  const form = useForm<RecommendationFormValues>({
    resolver: zodResolver(recommendationFormSchema) as Resolver<RecommendationFormValues>,
    defaultValues: defaultRecommendationFormValues,
    mode: 'onBlur',
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      recommendation
        ? {
            productId: recommendation.productId ?? 0,
            productName: recommendation.productName,
            position: recommendation.position,
            isActive: recommendation.isActive,
          }
        : defaultRecommendationFormValues,
    );
  }, [open, recommendation, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        product_id: values.productId,
        product_name: values.productName.trim(),
        position: values.position,
        is_active: values.isActive,
      };
      if (isEdit && recommendation) {
        await updateRec({ id: recommendation.id, payload });
        toast.success('Recommendation berhasil diupdate');
      } else {
        await createRec(payload);
        toast.success('Recommendation berhasil dibuat');
      }
      onOpenChange(false);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal menyimpan');
      toast.error(msg);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Recommendation' : 'Tambah Recommendation'}
          </DialogTitle>
          <DialogDescription>
            Produk rekomendasi di halaman Ramadhan. Masukkan Product ID langsung.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rec-pid">Product ID</Label>
              <Input
                id="rec-pid"
                type="number"
                min={1}
                {...form.register('productId', { valueAsNumber: true })}
              />
              {form.formState.errors.productId ? (
                <span className="text-xs text-error">
                  {form.formState.errors.productId.message}
                </span>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rec-pos">Posisi</Label>
              <Input
                id="rec-pos"
                type="number"
                min={0}
                {...form.register('position', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rec-name">Nama Produk (display)</Label>
            <Input id="rec-name" {...form.register('productName')} />
            {form.formState.errors.productName ? (
              <span className="text-xs text-error">
                {form.formState.errors.productName.message}
              </span>
            ) : null}
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

export const RecommendationFormDialog = memo(RecommendationFormDialogComponent);
