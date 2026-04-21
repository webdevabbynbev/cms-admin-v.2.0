import { z } from 'zod';

export const referralCodeFormSchema = z.object({
  code: z
    .string()
    .min(3, { message: 'Kode minimal 3 karakter' })
    .max(32, { message: 'Kode maksimal 32 karakter' })
    .regex(/^[A-Za-z0-9]+$/, {
      message: 'Kode hanya boleh alphanumeric',
    }),
  discountPercent: z
    .number()
    .int()
    .min(1, { message: 'Diskon minimal 1%' })
    .max(100, { message: 'Diskon maksimal 100%' }),
  maxUsesTotal: z
    .number()
    .int()
    .min(1, { message: 'Total qty minimal 1' }),
  isActive: z.boolean(),
  startedAt: z.string().nullable(),
  expiredAt: z.string().nullable(),
});

export type ReferralCodeFormValues = z.infer<typeof referralCodeFormSchema>;

export const defaultReferralCodeFormValues: ReferralCodeFormValues = {
  code: '',
  discountPercent: 10,
  maxUsesTotal: 100,
  isActive: true,
  startedAt: null,
  expiredAt: null,
};
