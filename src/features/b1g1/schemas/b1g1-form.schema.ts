import { z } from 'zod';

export const b1g1FormSchema = z.object({
  name: z.string().min(1, { message: 'Nama wajib diisi' }).max(100),
  code: z.string().min(1, { message: 'Kode wajib diisi' }).max(50),
  description: z.string().optional().nullable(),
  isActive: z.boolean(),
  isEcommerce: z.boolean(),
  isPos: z.boolean(),
  applyTo: z.string(),
  usageLimit: z.number().int().min(0).nullable(),
  minimumPurchase: z.number().min(0).nullable(),
  startedAt: z.string().nullable(),
  expiredAt: z.string().nullable(),
});

export type B1g1FormValues = z.infer<typeof b1g1FormSchema>;

export const defaultB1g1FormValues: B1g1FormValues = {
  name: '',
  code: '',
  description: '',
  isActive: true,
  isEcommerce: true,
  isPos: false,
  applyTo: 'all',
  usageLimit: null,
  minimumPurchase: null,
  startedAt: null,
  expiredAt: null,
};
