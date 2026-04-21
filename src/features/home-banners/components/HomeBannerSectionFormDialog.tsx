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
  defaultHomeBannerSectionFormValues,
  homeBannerSectionFormSchema,
  type HomeBannerSectionFormValues,
} from '../schemas';
import {
  useCreateHomeBannerSection,
  useUpdateHomeBannerSection,
} from '../hooks';
import type { HomeBannerSection } from '../types';

interface HomeBannerSectionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section: HomeBannerSection | null;
}

const HomeBannerSectionFormDialogComponent = ({
  open,
  onOpenChange,
  section,
}: HomeBannerSectionFormDialogProps) => {
  const isEdit = Boolean(section);
  const { mutateAsync: createSection } = useCreateHomeBannerSection();
  const { mutateAsync: updateSection } = useUpdateHomeBannerSection();

  const form = useForm<HomeBannerSectionFormValues>({
    resolver: zodResolver(homeBannerSectionFormSchema) as Resolver<HomeBannerSectionFormValues>,
    defaultValues: defaultHomeBannerSectionFormValues,
    mode: 'onBlur',
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      section
        ? { name: section.name, order: section.order }
        : defaultHomeBannerSectionFormValues,
    );
  }, [open, section, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = { name: values.name.trim(), order: values.order };
      if (isEdit && section) {
        await updateSection({ id: section.id, payload });
        toast.success('Section berhasil diupdate');
      } else {
        await createSection(payload);
        toast.success('Section berhasil dibuat');
      }
      onOpenChange(false);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal menyimpan section');
      toast.error(msg);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Section Banner' : 'Tambah Section Banner'}
          </DialogTitle>
          <DialogDescription>
            Section untuk grouping banner di homepage.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hb-name">Nama Section</Label>
            <Input id="hb-name" {...form.register('name')} />
            {form.formState.errors.name ? (
              <span className="text-xs text-error">
                {form.formState.errors.name.message}
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hb-order">Urutan</Label>
            <Input
              id="hb-order"
              type="number"
              min={0}
              {...form.register('order', { valueAsNumber: true })}
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

export const HomeBannerSectionFormDialog = memo(HomeBannerSectionFormDialogComponent);
