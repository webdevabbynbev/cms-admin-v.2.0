import { z } from 'zod';

export const profileFormSchema = z.object({
  firstName: z.string().min(1, { message: 'Nama depan wajib diisi' }).max(100),
  lastName: z.string().max(100),
  email: z.string().min(1, { message: 'Email wajib diisi' }).email('Format email tidak valid'),
  phone: z.string().max(20),
  photoProfile: z.string().nullable(),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
