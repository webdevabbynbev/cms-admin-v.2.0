import { z } from 'zod';

export const profileCategoryFormSchema = z.object({
  name: z.string().min(1, { message: 'Nama wajib diisi' }).max(100),
  type: z.string().optional().nullable(),
});

export type ProfileCategoryFormValues = z.infer<
  typeof profileCategoryFormSchema
>;

export const defaultProfileCategoryFormValues: ProfileCategoryFormValues = {
  name: '',
  type: '',
};

export const profileCategoryOptionFormSchema = z.object({
  profileCategoriesId: z
    .number()
    .int()
    .positive({ message: 'Pilih profile category parent' }),
  label: z.string().min(1, { message: 'Label wajib diisi' }).max(100),
  value: z.string().min(1, { message: 'Value wajib diisi' }).max(100),
  isActive: z.boolean(),
});

export type ProfileCategoryOptionFormValues = z.infer<
  typeof profileCategoryOptionFormSchema
>;

export const defaultProfileCategoryOptionFormValues: ProfileCategoryOptionFormValues = {
  profileCategoriesId: 0,
  label: '',
  value: '',
  isActive: true,
};
