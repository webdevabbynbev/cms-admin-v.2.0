import { z } from 'zod';

export const saleFormSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi').max(200),
  description: z.string().nullable().optional(),
  startDatetime: z.string().min(1, 'Tanggal mulai wajib diisi'),
  endDatetime: z.string().min(1, 'Tanggal selesai wajib diisi'),
  isPublish: z.boolean(),
  hasButton: z.boolean(),
  buttonText: z.string().nullable().optional(),
  buttonUrl: z.string().nullable().optional(),
});

export type SaleFormValues = z.infer<typeof saleFormSchema>;

export const defaultSaleFormValues: SaleFormValues = {
  title: '',
  description: '',
  startDatetime: '',
  endDatetime: '',
  isPublish: false,
  hasButton: false,
  buttonText: '',
  buttonUrl: '',
};
