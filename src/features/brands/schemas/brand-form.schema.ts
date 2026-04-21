import { z } from 'zod';

export const brandFormSchema = z.object({
  name: z.string().min(1, { message: 'Nama wajib diisi' }).max(100),
  description: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  isActive: z.boolean(),
});

export type BrandFormValues = z.infer<typeof brandFormSchema>;

export const defaultBrandFormValues: BrandFormValues = {
  name: '',
  description: '',
  country: '',
  website: '',
  isActive: true,
};
