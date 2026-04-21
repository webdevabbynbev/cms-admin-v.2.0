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
  defaultSettingFormValues,
  settingFormSchema,
  type SettingFormValues,
} from '../schemas';
import { useCreateSetting, useUpdateSetting } from '../hooks';
import type { Setting } from '../types';

interface SettingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setting: Setting | null;
}

const SettingFormDialogComponent = ({
  open,
  onOpenChange,
  setting,
}: SettingFormDialogProps) => {
  const isEdit = Boolean(setting);
  const { mutateAsync: createSetting } = useCreateSetting();
  const { mutateAsync: updateSetting } = useUpdateSetting();

  const form = useForm<SettingFormValues>({
    resolver: zodResolver(settingFormSchema) as Resolver<SettingFormValues>,
    defaultValues: defaultSettingFormValues,
    mode: 'onBlur',
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      setting
        ? { key: setting.key, group: setting.group, value: setting.value }
        : defaultSettingFormValues,
    );
  }, [open, setting, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (isEdit && setting) {
        await updateSetting({ id: setting.id, ...values });
        toast.success('Setting berhasil diupdate');
      } else {
        await createSetting(values);
        toast.success('Setting berhasil dibuat');
      }
      onOpenChange(false);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal menyimpan setting');
      toast.error(msg);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Setting' : 'Tambah Setting'}</DialogTitle>
          <DialogDescription>
            Setting menyimpan konfigurasi berupa pasangan key/group/value.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="setting-key">Key</Label>
            <Input
              id="setting-key"
              {...form.register('key')}
              placeholder="contoh: site_title"
            />
            {form.formState.errors.key ? (
              <span className="text-xs text-error">
                {form.formState.errors.key.message}
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="setting-group">Group</Label>
            <Input
              id="setting-group"
              {...form.register('group')}
              placeholder="contoh: general"
            />
            {form.formState.errors.group ? (
              <span className="text-xs text-error">
                {form.formState.errors.group.message}
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="setting-value">Value</Label>
            <Textarea
              id="setting-value"
              {...form.register('value')}
              placeholder="Isi nilai setting"
              rows={4}
            />
            {form.formState.errors.value ? (
              <span className="text-xs text-error">
                {form.formState.errors.value.message}
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

export const SettingFormDialog = memo(SettingFormDialogComponent);
