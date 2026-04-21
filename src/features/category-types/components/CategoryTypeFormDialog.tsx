import { memo, useEffect, useMemo } from 'react';
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
  defaultCategoryTypeFormValues,
  categoryTypeFormSchema,
  type CategoryTypeFormValues,
} from '../schemas';
import {
  useCategoryTypesFlat,
  useCreateCategoryType,
  useUpdateCategoryType,
} from '../hooks';
import type { CategoryType } from '../types';

interface CategoryTypeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryType: CategoryType | null;
}

const CategoryTypeFormDialogComponent = ({
  open,
  onOpenChange,
  categoryType,
}: CategoryTypeFormDialogProps) => {
  const isEdit = Boolean(categoryType);
  const { mutateAsync: createCategoryType } = useCreateCategoryType();
  const { mutateAsync: updateCategoryType } = useUpdateCategoryType();
  const { data: flatList } = useCategoryTypesFlat(open);

  const form = useForm<CategoryTypeFormValues>({
    resolver: zodResolver(categoryTypeFormSchema) as Resolver<CategoryTypeFormValues>,
    defaultValues: defaultCategoryTypeFormValues,
    mode: 'onBlur',
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      categoryType
        ? { name: categoryType.name, parentId: categoryType.parentId }
        : defaultCategoryTypeFormValues,
    );
  }, [open, categoryType, form]);

  const parentOptions = useMemo(() => {
    if (!flatList) return [];
    return flatList.filter((c) => !categoryType || c.id !== categoryType.id);
  }, [flatList, categoryType]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        name: values.name.trim(),
        parentId: values.parentId,
      };
      if (isEdit && categoryType) {
        await updateCategoryType({ slug: categoryType.slug, payload });
        toast.success('Category type berhasil diupdate');
      } else {
        await createCategoryType(payload);
        toast.success('Category type berhasil dibuat');
      }
      onOpenChange(false);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal menyimpan category type');
      toast.error(msg);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Category Type' : 'Tambah Category Type'}
          </DialogTitle>
          <DialogDescription>
            Kategori produk. Opsional pilih parent untuk tree.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cat-name">Nama</Label>
            <Input
              id="cat-name"
              {...form.register('name')}
              placeholder="Nama kategori"
            />
            {form.formState.errors.name ? (
              <span className="text-xs text-error">
                {form.formState.errors.name.message}
              </span>
            ) : null}
          </div>

          <Controller
            control={form.control}
            name="parentId"
            render={({ field }) => (
              <div className="flex flex-col gap-1.5">
                <Label>Parent (opsional)</Label>
                <Select
                  value={field.value == null ? 'none' : String(field.value)}
                  onValueChange={(v) =>
                    field.onChange(v === 'none' ? null : Number(v))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tidak ada parent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tanpa parent</SelectItem>
                    {parentOptions.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name} {c.level > 0 ? `(level ${c.level})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          />

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

export const CategoryTypeFormDialog = memo(CategoryTypeFormDialogComponent);
