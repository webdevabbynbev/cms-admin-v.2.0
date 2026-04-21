import { z } from 'zod';

const flashSaleVariantSchema = z.object({
  variantId: z.number().int().positive(),
  productId: z.number().int().positive(),
  productName: z.string(),
  sku: z.string().nullable(),
  image: z.string().nullable(),
  label: z.string(),
  basePrice: z.number().min(0),
  baseStock: z.number().int().min(0),
  flashPrice: z
    .number({ message: 'Harga flash harus angka' })
    .min(0),
  flashStock: z
    .number({ message: 'Stok flash harus angka' })
    .int()
    .min(0),
  isActive: z.boolean(),
});

export type FlashSaleVariantFormValues = z.infer<typeof flashSaleVariantSchema>;

export const flashSaleFormSchema = z
  .object({
    title: z.string().min(1, { message: 'Judul wajib diisi' }).max(255),
    description: z.string(),
    hasButton: z.boolean(),
    buttonText: z.string(),
    buttonUrl: z.string(),
    startDatetime: z.string().min(1, { message: 'Tanggal mulai wajib diisi' }),
    endDatetime: z.string().min(1, { message: 'Tanggal berakhir wajib diisi' }),
    isPublish: z.boolean(),
    variants: z.array(flashSaleVariantSchema),
  })
  .superRefine((data, ctx) => {
    if (data.hasButton) {
      if (!data.buttonText.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Teks tombol wajib diisi',
          path: ['buttonText'],
        });
      }
      if (!data.buttonUrl.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'URL tombol wajib diisi',
          path: ['buttonUrl'],
        });
      }
    }

    if (
      data.startDatetime &&
      data.endDatetime &&
      new Date(data.endDatetime).getTime() <=
        new Date(data.startDatetime).getTime()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Tanggal berakhir harus setelah tanggal mulai',
        path: ['endDatetime'],
      });
    }

    if (data.variants.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Minimal pilih satu varian untuk flash sale',
        path: ['variants'],
      });
    }

    data.variants.forEach((variant, index) => {
      if (variant.flashPrice >= variant.basePrice && variant.basePrice > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Harga flash harus lebih rendah dari harga dasar',
          path: ['variants', index, 'flashPrice'],
        });
      }
      if (variant.flashStock > variant.baseStock && variant.baseStock > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Stok flash melebihi stok varian',
          path: ['variants', index, 'flashStock'],
        });
      }
    });
  });

export type FlashSaleFormValues = z.infer<typeof flashSaleFormSchema>;

export const defaultFlashSaleFormValues: FlashSaleFormValues = {
  title: '',
  description: '',
  hasButton: false,
  buttonText: '',
  buttonUrl: '',
  startDatetime: '',
  endDatetime: '',
  isPublish: false,
  variants: [],
};
