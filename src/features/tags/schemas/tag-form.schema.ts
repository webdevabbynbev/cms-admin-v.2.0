import { z } from 'zod';

export const tagFormSchema = z.object({
  name: z.string().min(1, { message: 'Nama wajib diisi' }).max(100),
  description: z.string().optional().nullable(),
});

export type TagFormValues = z.infer<typeof tagFormSchema>;

export const defaultTagFormValues: TagFormValues = {
  name: '',
  description: '',
};
