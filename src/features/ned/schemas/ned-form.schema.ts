import { z } from 'zod';

export const nedFormSchema = z.object({
  name: z.string().min(1, { message: 'Nama wajib diisi' }).max(100),
  description: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  price: z.number().min(0).nullable(),
  quantity: z.number().int().min(0).nullable(),
  isActive: z.boolean(),
  isVisibleEcommerce: z.boolean(),
  isVisiblePos: z.boolean(),
});

export type NedFormValues = z.infer<typeof nedFormSchema>;

export const defaultNedFormValues: NedFormValues = {
  name: '',
  description: '',
  sku: '',
  price: null,
  quantity: null,
  isActive: true,
  isVisibleEcommerce: true,
  isVisiblePos: false,
};
