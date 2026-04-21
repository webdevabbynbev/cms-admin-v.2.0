import { z } from 'zod';
import { BannerPosition, BannerType } from '../types';

export const bannerFormSchema = z
  .object({
    title: z.string().min(1, { message: 'Title is required' }).max(255),
    description: z.string(),
    position: z.nativeEnum(BannerPosition),
    banner_type: z.nativeEnum(BannerType),
    has_button: z.boolean(),
    button_text: z.string(),
    button_url: z.string(),
    image_url: z.string(),
    image_mobile_url: z.string(),
    image_file: z.union([z.instanceof(File), z.null()]),
    image_mobile_file: z.union([z.instanceof(File), z.null()]),
  })
  .superRefine((data, ctx) => {
    if (!data.image_url && !data.image_file) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Desktop image is required (upload a file or provide a URL)',
        path: ['image_file'],
      });
    }

    if (data.has_button) {
      if (!data.button_text.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Button text is required when button is enabled',
          path: ['button_text'],
        });
      }
      if (!data.button_url.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Button URL is required when button is enabled',
          path: ['button_url'],
        });
      }
    }
  });

export type BannerFormValues = z.infer<typeof bannerFormSchema>;

export const defaultBannerFormValues: BannerFormValues = {
  title: '',
  description: '',
  position: BannerPosition.BottomLeft,
  banner_type: BannerType.General,
  has_button: false,
  button_text: '',
  button_url: '',
  image_url: '',
  image_mobile_url: '',
  image_file: null,
  image_mobile_file: null,
};
