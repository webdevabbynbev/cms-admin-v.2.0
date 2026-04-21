import { z } from 'zod';

export const picksFormSchema = z.object({
  productId: z.number({ error: 'Pilih produk' }).int().positive('Pilih produk'),
  order: z.number().int().min(0),
  isActive: z.boolean(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
});

export type PicksFormValues = z.infer<typeof picksFormSchema>;

export const defaultPicksFormValues: PicksFormValues = {
  productId: 0,
  order: 1,
  isActive: true,
  startDate: null,
  endDate: null,
};
