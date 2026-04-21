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
  adminCreateSchema,
  adminEditSchema,
  defaultAdminFormValues,
  type AdminFormValues,
} from '../schemas';
import { useCreateAdmin, useUpdateAdmin } from '../hooks';
import { permissionsArrayToObject } from '../utils/normalize';
import { ADMIN_ROLE_OPTIONS, AdminRole } from '../types';
import type { Admin } from '../types';
import { AdminPermissionsTree } from './AdminPermissionsTree';

interface AdminFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admin: Admin | null;
}

const AdminFormDialogComponent = ({
  open,
  onOpenChange,
  admin,
}: AdminFormDialogProps) => {
  const isEdit = Boolean(admin);
  const { mutateAsync: createAdmin } = useCreateAdmin();
  const { mutateAsync: updateAdmin } = useUpdateAdmin();

  const form = useForm<AdminFormValues>({
    resolver: zodResolver(
      isEdit ? adminEditSchema : adminCreateSchema,
    ) as Resolver<AdminFormValues>,
    defaultValues: defaultAdminFormValues,
    mode: 'onBlur',
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      admin
        ? {
            firstName: admin.firstName,
            lastName: admin.lastName,
            email: admin.email,
            password: '',
            role: admin.role ?? AdminRole.Admin,
            permissions: admin.permissions,
          }
        : defaultAdminFormValues,
    );
  }, [open, admin, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const basePayload = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        role: values.role,
        isActive: 1 as const,
        permissions: permissionsArrayToObject(values.permissions),
      };

      if (isEdit && admin) {
        await updateAdmin({
          id: admin.id,
          payload: {
            ...basePayload,
            password:
              values.password && values.password.trim().length > 0
                ? values.password
                : null,
          },
        });
        toast.success('Admin berhasil diupdate');
      } else {
        await createAdmin({
          ...basePayload,
          password: values.password ?? '',
        });
        toast.success('Admin berhasil dibuat');
      }
      onOpenChange(false);
    } catch (error) {
      const msg =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        (error instanceof Error ? error.message : 'Gagal menyimpan admin');
      toast.error(msg);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Admin' : 'Tambah Admin'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Ubah detail user admin. Kosongkan password untuk tidak mengubahnya.'
              : 'Buat user admin baru dengan role dan hak akses modul.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="admin-firstName">First Name</Label>
              <Input
                id="admin-firstName"
                {...form.register('firstName')}
                placeholder="Nama depan"
              />
              {form.formState.errors.firstName ? (
                <span className="text-xs text-error">
                  {form.formState.errors.firstName.message}
                </span>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="admin-lastName">Last Name</Label>
              <Input
                id="admin-lastName"
                {...form.register('lastName')}
                placeholder="Nama belakang"
              />
              {form.formState.errors.lastName ? (
                <span className="text-xs text-error">
                  {form.formState.errors.lastName.message}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              type="email"
              {...form.register('email')}
              placeholder="user@example.com"
              autoComplete="off"
            />
            {form.formState.errors.email ? (
              <span className="text-xs text-error">
                {form.formState.errors.email.message}
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="admin-password">
              Password{' '}
              {isEdit ? (
                <span className="text-xs text-muted-foreground">
                  (kosongkan jika tidak diubah)
                </span>
              ) : null}
            </Label>
            <Input
              id="admin-password"
              type="password"
              {...form.register('password')}
              placeholder={
                isEdit ? 'Kosongkan untuk tidak mengubah' : 'Minimal 6 karakter'
              }
              autoComplete="new-password"
            />
            {form.formState.errors.password ? (
              <span className="text-xs text-error">
                {form.formState.errors.password.message}
              </span>
            ) : null}
          </div>

          <Controller
            control={form.control}
            name="role"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-1.5">
                <Label>Role</Label>
                <Select
                  value={String(field.value)}
                  onValueChange={(v) => field.onChange(Number(v) as AdminRole)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ADMIN_ROLE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
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

          <Controller
            control={form.control}
            name="permissions"
            render={({ field }) => (
              <div className="flex flex-col gap-2">
                <Label>Module Access</Label>
                <AdminPermissionsTree
                  value={field.value}
                  onChange={field.onChange}
                />
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

export const AdminFormDialog = memo(AdminFormDialogComponent);
