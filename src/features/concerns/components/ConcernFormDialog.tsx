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
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

import {
  defaultConcernFormValues,
  concernFormSchema,
  type ConcernFormValues,
} from '../schemas';
import { useCreateConcern, useUpdateConcern } from '../hooks';
import type { Concern } from '../types';

interface ConcernFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  concern: Concern | null;
}

const ConcernFormDialogComponent = ({
  open,
  onOpenChange,
  concern,
}: ConcernFormDialogProps) => {
  const isEdit = Boolean(concern);
  const { mutateAsync: createConcern } = useCreateConcern();
  const { mutateAsync: updateConcern } = useUpdateConcern();

  const form = useForm<ConcernFormValues>({
    resolver: zodResolver(concernFormSchema) as Resolver<ConcernFormValues>,
    defaultValues: defaultConcernFormValues,
    mode: 'onBlur',
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      concern
        ? {
            name: concern.name,
            description: concern.description ?? '',
            position: concern.position,
          }
        : defaultConcernFormValues,
    );
  }, [open, concern, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        name: values.name.trim(),
        description: values.description?.trim() || null,
        position: values.position ?? 0,
      };
      if (isEdit && concern) {
        await updateConcern({ slug: concern.slug, payload });
        toast.success('Concern berhasil diupdate');
      } else {
        await createConcern(payload);
        toast.success('Concern berhasil dibuat');
      }
      onOpenChange(false);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal menyimpan concern');
      toast.error(msg);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Concern' : 'Tambah Concern'}</DialogTitle>
          <DialogDescription>Kategori concern (parent).</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="concern-name">Nama</Label>
            <Input
              id="concern-name"
              {...form.register('name')}
              placeholder="Nama concern"
            />
            {form.formState.errors.name ? (
              <span className="text-xs text-error">
                {form.formState.errors.name.message}
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="concern-desc">Deskripsi</Label>
            <Textarea
              id="concern-desc"
              {...form.register('description')}
              placeholder="Deskripsi (opsional)"
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="concern-pos">Posisi</Label>
            <Input
              id="concern-pos"
              type="number"
              min={0}
              {...form.register('position', { valueAsNumber: true })}
              placeholder="0"
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

export const ConcernFormDialog = memo(ConcernFormDialogComponent);
