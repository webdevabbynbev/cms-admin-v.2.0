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
  defaultProfileCategoryFormValues,
  profileCategoryFormSchema,
  type ProfileCategoryFormValues,
} from '../schemas';
import {
  useCreateProfileCategory,
  useUpdateProfileCategory,
} from '../hooks';
import type { ProfileCategory } from '../types';

interface ProfileCategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: ProfileCategory | null;
}

const ProfileCategoryFormDialogComponent = ({
  open,
  onOpenChange,
  category,
}: ProfileCategoryFormDialogProps) => {
  const isEdit = Boolean(category);
  const { mutateAsync: createCategory } = useCreateProfileCategory();
  const { mutateAsync: updateCategory } = useUpdateProfileCategory();

  const form = useForm<ProfileCategoryFormValues>({
    resolver: zodResolver(profileCategoryFormSchema) as Resolver<ProfileCategoryFormValues>,
    defaultValues: defaultProfileCategoryFormValues,
    mode: 'onBlur',
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      category
        ? { name: category.name, type: category.type ?? '' }
        : defaultProfileCategoryFormValues,
    );
  }, [open, category, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        name: values.name.trim(),
        type: values.type?.trim() || null,
      };
      if (isEdit && category) {
        await updateCategory({ id: category.id, payload });
        toast.success('Profile category berhasil diupdate');
      } else {
        await createCategory(payload);
        toast.success('Profile category berhasil dibuat');
      }
      onOpenChange(false);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal menyimpan profile category');
      toast.error(msg);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Profile Category' : 'Tambah Profile Category'}
          </DialogTitle>
          <DialogDescription>
            Kategori profil pengguna (mis. tipe kulit, tipe rambut).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pc-name">Nama</Label>
            <Input
              id="pc-name"
              {...form.register('name')}
              placeholder="Nama category"
            />
            {form.formState.errors.name ? (
              <span className="text-xs text-error">
                {form.formState.errors.name.message}
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pc-type">Type</Label>
            <Input
              id="pc-type"
              {...form.register('type')}
              placeholder="Contoh: Skin, Hair"
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

export const ProfileCategoryFormDialog = memo(ProfileCategoryFormDialogComponent);
