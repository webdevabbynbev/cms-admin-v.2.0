import { z } from 'zod';
import {
  VoucherRewardType,
  VoucherScopeType,
  VoucherType,
  VoucherValueMode,
} from '../types';

export const voucherFormSchema = z
  .object({
    id: z.number().optional(),
    name: z.string().min(1, { message: 'Nama voucher wajib diisi' }).max(255),
    code: z.string().min(1, { message: 'Kode voucher wajib diisi' }).max(100),
    type: z.nativeEnum(VoucherType),
    rewardType: z.nativeEnum(VoucherRewardType).nullable(),
    valueMode: z.nativeEnum(VoucherValueMode),
    price: z
      .number({ message: 'Nominal harus angka' })
      .min(0)
      .nullable(),
    percentage: z
      .number({ message: 'Persentase harus angka' })
      .min(0)
      .max(100)
      .nullable(),
    maxDiscPrice: z
      .number({ message: 'Max diskon harus angka' })
      .min(0)
      .nullable(),
    minPurchaseAmount: z
      .number({ message: 'Min pembelian harus angka' })
      .min(0)
      .nullable(),
    qty: z
      .number({ message: 'Kuota harus angka' })
      .int()
      .min(0),
    perUserLimit: z
      .number({ message: 'Batas per user harus angka' })
      .int()
      .min(0)
      .nullable(),
    isActive: z.boolean(),
    isVisible: z.boolean(),
    isStackable: z.boolean(),
    isVoucherStackable: z.boolean(),
    scopeType: z.nativeEnum(VoucherScopeType),
    scopeIds: z.array(z.number().int().positive()),
    giftProductIds: z.array(z.number().int().positive()),
    startedAt: z.string().nullable(),
    expiredAt: z.string().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.type === VoucherType.Product) {
      if (data.valueMode === VoucherValueMode.Percentage) {
        if (data.percentage == null || data.percentage <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Persentase wajib diisi',
            path: ['percentage'],
          });
        }
      } else {
        if (data.price == null || data.price <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Nominal diskon wajib diisi',
            path: ['price'],
          });
        }
      }
    }

    if (data.type === VoucherType.Gift && data.giftProductIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Minimal pilih satu produk hadiah',
        path: ['giftProductIds'],
      });
    }

    if (
      data.scopeType !== VoucherScopeType.All &&
      data.scopeIds.length === 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Minimal pilih satu item untuk cakupan spesifik',
        path: ['scopeIds'],
      });
    }

    if (!data.startedAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Tanggal mulai wajib diisi',
        path: ['startedAt'],
      });
    }
    if (!data.expiredAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Tanggal berakhir wajib diisi',
        path: ['expiredAt'],
      });
    }
    if (
      data.startedAt &&
      data.expiredAt &&
      new Date(data.expiredAt).getTime() <= new Date(data.startedAt).getTime()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Tanggal berakhir harus setelah tanggal mulai',
        path: ['expiredAt'],
      });
    }
  });

export type VoucherFormValues = z.infer<typeof voucherFormSchema>;

export const defaultVoucherFormValues: VoucherFormValues = {
  name: '',
  code: '',
  type: VoucherType.Product,
  rewardType: VoucherRewardType.Discount,
  valueMode: VoucherValueMode.Percentage,
  price: null,
  percentage: null,
  maxDiscPrice: null,
  minPurchaseAmount: null,
  qty: 0,
  perUserLimit: null,
  isActive: true,
  isVisible: true,
  isStackable: true,
  isVoucherStackable: true,
  scopeType: VoucherScopeType.All,
  scopeIds: [],
  giftProductIds: [],
  startedAt: null,
  expiredAt: null,
};
