import { z } from 'zod';

export const giftFormSchema = z.object({
  productName: z.string().min(1, { message: 'Nama produk wajib diisi' }).max(255),
  brandName: z.string().optional().nullable(),
  variantName: z.string().optional().nullable(),
  productVariantSku: z.string().optional().nullable(),
  price: z.number().min(0),
  stock: z.number().int().min(0),
  weight: z.number().min(0),
  imageUrl: z.string().optional().nullable(),
  isSellable: z.boolean(),
  isActive: z.boolean(),
});

export type GiftFormValues = z.infer<typeof giftFormSchema>;

export const defaultGiftFormValues: GiftFormValues = {
  productName: '',
  brandName: '',
  variantName: '',
  productVariantSku: '',
  price: 0,
  stock: 0,
  weight: 0,
  imageUrl: '',
  isSellable: false,
  isActive: true,
};
