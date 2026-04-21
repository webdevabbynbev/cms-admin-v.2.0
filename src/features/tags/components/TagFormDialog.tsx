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
  defaultTagFormValues,
  tagFormSchema,
  type TagFormValues,
} from '../schemas';
import { useCreateTag, useUpdateTag } from '../hooks';
import type { Tag } from '../types';

interface TagFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag: Tag | null;
}

const TagFormDialogComponent = ({ open, onOpenChange, tag }: TagFormDialogProps) => {
  const isEdit = Boolean(tag);
  const { mutateAsync: createTag } = useCreateTag();
  const { mutateAsync: updateTag } = useUpdateTag();

  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagFormSchema) as Resolver<TagFormValues>,
    defaultValues: defaultTagFormValues,
    mode: 'onBlur',
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      tag
        ? { name: tag.name, description: tag.description ?? '' }
        : defaultTagFormValues,
    );
  }, [open, tag, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        name: values.name.trim(),
        description: values.description?.trim() || null,
      };
      if (isEdit && tag) {
        await updateTag({ slug: tag.slug, payload });
        toast.success('Tag berhasil diupdate');
      } else {
        await createTag(payload);
        toast.success('Tag berhasil dibuat');
      }
      onOpenChange(false);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal menyimpan tag');
      toast.error(msg);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Tag' : 'Tambah Tag'}</DialogTitle>
          <DialogDescription>Tag untuk label produk.</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tag-name">Nama</Label>
            <Input id="tag-name" {...form.register('name')} placeholder="Nama tag" />
            {form.formState.errors.name ? (
              <span className="text-xs text-error">
                {form.formState.errors.name.message}
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tag-desc">Deskripsi</Label>
            <Textarea
              id="tag-desc"
              {...form.register('description')}
              placeholder="Deskripsi (opsional)"
              rows={3}
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

export const TagFormDialog = memo(TagFormDialogComponent);
