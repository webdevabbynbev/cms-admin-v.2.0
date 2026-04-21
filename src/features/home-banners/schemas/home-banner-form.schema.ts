import { z } from 'zod';

export const homeBannerSectionFormSchema = z.object({
  name: z.string().min(1, { message: 'Nama wajib diisi' }).max(100),
  order: z.number().int().min(0),
});

export type HomeBannerSectionFormValues = z.infer<
  typeof homeBannerSectionFormSchema
>;

export const defaultHomeBannerSectionFormValues: HomeBannerSectionFormValues = {
  name: '',
  order: 0,
};
