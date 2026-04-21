import { z } from 'zod';
import { VoucherRewardType, VoucherType } from '../types';

export const voucherFilterSchema = z.object({
  search: z.string().optional().default(''),
  type: z.nativeEnum(VoucherType).optional(),
  rewardType: z.nativeEnum(VoucherRewardType).optional(),
});

export type VoucherFilterValues = z.infer<typeof voucherFilterSchema>;

export const defaultVoucherFilterValues: VoucherFilterValues = {
  search: '',
  type: undefined,
  rewardType: undefined,
};
