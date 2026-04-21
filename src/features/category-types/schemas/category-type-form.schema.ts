import { z } from 'zod';

export const categoryTypeFormSchema = z.object({
  name: z.string().min(1, { message: 'Nama wajib diisi' }).max(100),
  parentId: z.number().int().positive().nullable(),
});

export type CategoryTypeFormValues = z.infer<typeof categoryTypeFormSchema>;

export const defaultCategoryTypeFormValues: CategoryTypeFormValues = {
  name: '',
  parentId: null,
};
