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
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

import {
  defaultBannerFormValues,
  bannerFormSchema,
  type BannerFormValues,
} from '../schemas';
import { useCreateRamadanBanner, useUpdateRamadanBanner } from '../hooks';
import type { RamadanRecommendationBanner } from '../types';

interface BannerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banner: RamadanRecommendationBanner | null;
}

const BannerFormDialogComponent = ({
  open,
  onOpenChange,
  banner,
}: BannerFormDialogProps) => {
  const isEdit = Boolean(banner);
  const { mutateAsync: createBanner } = useCreateRamadanBanner();
  const { mutateAsync: updateBanner } = useUpdateRamadanBanner();

  const form = useForm<BannerFormValues>({
    resolver: zodResolver(bannerFormSchema) as Resolver<BannerFormValues>,
    defaultValues: defaultBannerFormValues,
    mode: 'onBlur',
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      banner
        ? {
            title: banner.title,
            bannerDate: banner.bannerDate ?? '',
            imageUrl: banner.imageUrl ?? '',
            imageMobileUrl: banner.imageMobileUrl ?? '',
          }
        : defaultBannerFormValues,
    );
  }, [open, banner, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        title: values.title.trim(),
        banner_date: values.bannerDate,
        image_url: values.imageUrl.trim(),
        image_type: 'upload',
        image_mobile_url: values.imageMobileUrl.trim(),
        image_mobile_type: 'upload',
      };
      if (isEdit && banner) {
        await updateBanner({ id: banner.id, payload });
        toast.success('Banner berhasil diupdate');
      } else {
        await createBanner(payload);
        toast.success('Banner berhasil dibuat');
      }
      onOpenChange(false);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal menyimpan banner');
      toast.error(msg);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Banner' : 'Tambah Banner'}</DialogTitle>
          <DialogDescription>Banner Ramadhan per tanggal.</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="b-title">Title</Label>
            <Input id="b-title" {...form.register('title')} />
            {form.formState.errors.title ? (
              <span className="text-xs text-error">
                {form.formState.errors.title.message}
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="b-date">Tanggal (YYYY-MM-DD)</Label>
            <Input id="b-date" type="date" {...form.register('bannerDate')} />
            {form.formState.errors.bannerDate ? (
              <span className="text-xs text-error">
                {form.formState.errors.bannerDate.message}
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="b-img">Image URL (desktop)</Label>
            <Input id="b-img" {...form.register('imageUrl')} placeholder="https://..." />
            {form.formState.errors.imageUrl ? (
              <span className="text-xs text-error">
                {form.formState.errors.imageUrl.message}
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="b-img-m">Image URL (mobile)</Label>
            <Input id="b-img-m" {...form.register('imageMobileUrl')} placeholder="https://..." />
            {form.formState.errors.imageMobileUrl ? (
              <span className="text-xs text-error">
                {form.formState.errors.imageMobileUrl.message}
              </span>
            ) : null}
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

export const BannerFormDialog = memo(BannerFormDialogComponent);
