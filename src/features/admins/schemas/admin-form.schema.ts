import { z } from 'zod';
import { AdminRole } from '../types';

const nameField = z
  .string()
  .min(1, { message: 'Wajib diisi' })
  .max(50, { message: 'Maksimal 50 karakter' })
  .regex(/^[a-zA-Z\s]+$/, { message: 'Hanya boleh berisi huruf' });

const emailField = z
  .string()
  .min(1, { message: 'Email wajib diisi' })
  .email({ message: 'Format email tidak valid' });

const roleField = z
  .nativeEnum(AdminRole, { message: 'Role wajib dipilih' });

export const adminCreateSchema = z.object({
  firstName: nameField,
  lastName: nameField,
  email: emailField,
  password: z
    .string()
    .min(6, { message: 'Password minimal 6 karakter' })
    .max(100, { message: 'Password maksimal 100 karakter' }),
  role: roleField,
  permissions: z.array(z.string()),
});

export const adminEditSchema = z.object({
  firstName: nameField,
  lastName: nameField,
  email: emailField,
  password: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.trim().length === 0 || val.trim().length >= 6,
      { message: 'Password minimal 6 karakter' },
    ),
  role: roleField,
  permissions: z.array(z.string()),
});

export type AdminFormValues = z.infer<typeof adminCreateSchema>;

export const defaultAdminFormValues: AdminFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: AdminRole.Admin,
  permissions: [],
};
