import { z } from 'zod';

export const spinPrizeFormSchema = z.object({
  name: z.string().min(1, { message: 'Nama wajib diisi' }).max(100),
  weight: z.number().int().min(1, { message: 'Weight minimal 1' }),
  isGrand: z.boolean(),
  isActive: z.boolean(),
  dailyQuota: z.number().int().min(0).nullable(),
  voucherId: z.number().int().nullable(),
  voucherQty: z.number().int().min(1),
});

export type SpinPrizeFormValues = z.infer<typeof spinPrizeFormSchema>;

export const defaultSpinPrizeFormValues: SpinPrizeFormValues = {
  name: '',
  weight: 1,
  isGrand: false,
  isActive: true,
  dailyQuota: null,
  voucherId: null,
  voucherQty: 1,
};

export const recommendationFormSchema = z.object({
  productId: z.number().int().positive({ message: 'Product ID wajib diisi' }),
  productName: z.string().min(1, { message: 'Nama produk wajib diisi' }),
  position: z.number().int().min(0),
  isActive: z.boolean(),
});

export type RecommendationFormValues = z.infer<typeof recommendationFormSchema>;

export const defaultRecommendationFormValues: RecommendationFormValues = {
  productId: 0,
  productName: '',
  position: 0,
  isActive: true,
};

export const bannerFormSchema = z.object({
  title: z.string().min(1, { message: 'Title wajib diisi' }),
  bannerDate: z.string().min(1, { message: 'Tanggal wajib diisi' }),
  imageUrl: z.string().min(1, { message: 'Image URL desktop wajib diisi' }),
  imageMobileUrl: z.string().min(1, { message: 'Image URL mobile wajib diisi' }),
});

export type BannerFormValues = z.infer<typeof bannerFormSchema>;

export const defaultBannerFormValues: BannerFormValues = {
  title: '',
  bannerDate: '',
  imageUrl: '',
  imageMobileUrl: '',
};
