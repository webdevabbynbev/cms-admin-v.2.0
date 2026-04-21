import { memo, useEffect } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  defaultProfileCategoryOptionFormValues,
  profileCategoryOptionFormSchema,
  type ProfileCategoryOptionFormValues,
} from '../schemas';
import {
  useProfileCategories,
  useCreateProfileCategoryOption,
  useUpdateProfileCategoryOption,
} from '../hooks';
import type { ProfileCategoryOption } from '../types';

interface ProfileCategoryOptionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  option: ProfileCategoryOption | null;
}

const ProfileCategoryOptionFormDialogComponent = ({
  open,
  onOpenChange,
  option,
}: ProfileCategoryOptionFormDialogProps) => {
  const isEdit = Boolean(option);
  const { mutateAsync: createOption } = useCreateProfileCategoryOption();
  const { mutateAsync: updateOption } = useUpdateProfileCategoryOption();
  const { data: categoriesData } = useProfileCategories({
    page: 1,
    perPage: 500,
  });

  const form = useForm<ProfileCategoryOptionFormValues>({
    resolver: zodResolver(profileCategoryOptionFormSchema) as Resolver<ProfileCategoryOptionFormValues>,
    defaultValues: defaultProfileCategoryOptionFormValues,
    mode: 'onBlur',
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      option
        ? {
            profileCategoriesId: option.profileCategoriesId,
            label: option.label,
            value: option.value,
            isActive: option.isActive,
          }
        : defaultProfileCategoryOptionFormValues,
    );
  }, [open, option, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        profileCategoriesId: values.profileCategoriesId,
        label: values.label.trim(),
        value: values.value.trim(),
        isActive: values.isActive,
      };
      if (isEdit && option) {
        await updateOption({ id: option.id, payload });
        toast.success('Option berhasil diupdate');
      } else {
        await createOption(payload);
        toast.success('Option berhasil dibuat');
      }
      onOpenChange(false);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal menyimpan option');
      toast.error(msg);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Profile Category Option' : 'Tambah Option'}
          </DialogTitle>
          <DialogDescription>
            Option di bawah profile category parent.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Controller
            control={form.control}
            name="profileCategoriesId"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-1.5">
                <Label>Category Parent</Label>
                <Select
                  value={field.value ? String(field.value) : ''}
                  onValueChange={(v) => field.onChange(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(categoriesData?.data ?? []).map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.error ? (
                  <span className="text-xs text-error">
                    {fieldState.error.message}
                  </span>
                ) : null}
              </div>
            )}
          />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pco-label">Label</Label>
            <Input
              id="pco-label"
              {...form.register('label')}
              placeholder="Contoh: Oily"
            />
            {form.formState.errors.label ? (
              <span className="text-xs text-error">
                {form.formState.errors.label.message}
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pco-value">Value</Label>
            <Input
              id="pco-value"
              {...form.register('value')}
              placeholder="Contoh: oily"
            />
            {form.formState.errors.value ? (
              <span className="text-xs text-error">
                {form.formState.errors.value.message}
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

export const ProfileCategoryOptionFormDialog = memo(
  ProfileCategoryOptionFormDialogComponent,
);
