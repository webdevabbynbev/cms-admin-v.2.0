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
import { Textarea } from '@/components/ui/textarea';
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
  defaultConcernOptionFormValues,
  concernOptionFormSchema,
  type ConcernOptionFormValues,
} from '../schemas';
import {
  useConcerns,
  useCreateConcernOption,
  useUpdateConcernOption,
} from '../hooks';
import type { ConcernOption } from '../types';

interface ConcernOptionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  option: ConcernOption | null;
}

const ConcernOptionFormDialogComponent = ({
  open,
  onOpenChange,
  option,
}: ConcernOptionFormDialogProps) => {
  const isEdit = Boolean(option);
  const { mutateAsync: createOption } = useCreateConcernOption();
  const { mutateAsync: updateOption } = useUpdateConcernOption();
  const { data: concernsData } = useConcerns({ page: 1, perPage: 500 });

  const form = useForm<ConcernOptionFormValues>({
    resolver: zodResolver(concernOptionFormSchema) as Resolver<ConcernOptionFormValues>,
    defaultValues: defaultConcernOptionFormValues,
    mode: 'onBlur',
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      option
        ? {
            concernId: option.concernId,
            name: option.name,
            description: option.description ?? '',
            position: option.position,
          }
        : defaultConcernOptionFormValues,
    );
  }, [open, option, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        concernId: values.concernId,
        name: values.name.trim(),
        description: values.description?.trim() || null,
        position: values.position ?? 0,
      };
      if (isEdit && option) {
        await updateOption({ slug: option.slug, payload });
        toast.success('Concern option berhasil diupdate');
      } else {
        await createOption(payload);
        toast.success('Concern option berhasil dibuat');
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
            {isEdit ? 'Edit Concern Option' : 'Tambah Concern Option'}
          </DialogTitle>
          <DialogDescription>
            Option di bawah concern parent.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Controller
            control={form.control}
            name="concernId"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-1.5">
                <Label>Concern Parent</Label>
                <Select
                  value={field.value ? String(field.value) : ''}
                  onValueChange={(v) => field.onChange(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih concern" />
                  </SelectTrigger>
                  <SelectContent>
                    {(concernsData?.data ?? []).map((c) => (
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
            <Label htmlFor="opt-name">Nama</Label>
            <Input
              id="opt-name"
              {...form.register('name')}
              placeholder="Nama option"
            />
            {form.formState.errors.name ? (
              <span className="text-xs text-error">
                {form.formState.errors.name.message}
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="opt-desc">Deskripsi</Label>
            <Textarea
              id="opt-desc"
              {...form.register('description')}
              placeholder="Deskripsi (opsional)"
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="opt-pos">Posisi</Label>
            <Input
              id="opt-pos"
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

export const ConcernOptionFormDialog = memo(ConcernOptionFormDialogComponent);
