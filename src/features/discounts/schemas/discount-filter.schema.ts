import { z } from 'zod';
import { DiscountScope, DiscountStatus } from '../types';

export const discountFilterSchema = z.object({
  search: z.string().optional().default(''),
  status: z.nativeEnum(DiscountStatus).optional(),
  scope: z.nativeEnum(DiscountScope).optional(),
  channel: z.enum(['ecommerce', 'pos']).optional(),
});

export type DiscountFilterValues = z.infer<typeof discountFilterSchema>;

export const defaultDiscountFilterValues: DiscountFilterValues = {
  search: '',
  status: undefined,
  scope: undefined,
  channel: undefined,
};
