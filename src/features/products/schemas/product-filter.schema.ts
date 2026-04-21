import { z } from 'zod';
import { ProductStatusFilter, SeoStatusFilter } from '../types';

export const productFilterSchema = z.object({
  name: z.string().default(''),
  status: z.nativeEnum(ProductStatusFilter).default(ProductStatusFilter.All),
  brandId: z
    .union([z.number(), z.null()])
    .nullable()
    .default(null),
  seoStatus: z.nativeEnum(SeoStatusFilter).default(SeoStatusFilter.All),
});

export type ProductFilterFormValues = z.infer<typeof productFilterSchema>;
