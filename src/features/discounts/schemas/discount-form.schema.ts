import { z } from 'zod';
import {
  DiscountDayOfWeek,
  DiscountItemValueType,
  DiscountScope,
} from '../types';

const discountVariantItemFormSchema = z.object({
  key: z.string(),
  productVariantId: z.number().int().positive(),
  productId: z.number().int().positive().nullable(),
  productName: z.string().optional().default(''),
  variantLabel: z.string().optional().default(''),
  brandId: z.number().int().positive().nullable().optional(),
  brandName: z.string().optional().default(''),
  sku: z.string().nullable().optional(),
  basePrice: z.number().nullable().optional(),
  stock: z.number().nullable().optional(),
  isActive: z.boolean(),
  valueType: z.nativeEnum(DiscountItemValueType),
  value: z
    .number({ message: 'Nilai diskon harus angka' })
    .min(0)
    .nullable(),
  maxDiscount: z
    .number({ message: 'Max diskon harus angka' })
    .min(0)
    .nullable(),
  promoStock: z
    .number({ message: 'Promo stock harus angka' })
    .int()
    .min(0)
    .nullable(),
  purchaseLimit: z
    .number({ message: 'Batas pembelian harus angka' })
    .int()
    .min(0)
    .nullable(),
});

export type DiscountVariantItemFormValues = z.infer<
  typeof discountVariantItemFormSchema
>;

export const discountFormSchema = z
  .object({
    name: z.string().min(1, { message: 'Nama diskon wajib diisi' }).max(255),
    code: z.string().max(100),
    description: z.string(),
    scope: z.nativeEnum(DiscountScope),
    isActive: z.boolean(),
    isEcommerce: z.boolean(),
    isPos: z.boolean(),
    startedAt: z.string().nullable(),
    expiredAt: z.string().nullable(),
    noExpiry: z.boolean(),
    daysOfWeek: z.array(z.nativeEnum(DiscountDayOfWeek)),
    allProductsPercent: z
      .number({ message: 'Persentase harus angka' })
      .min(0)
      .max(100)
      .nullable(),
    allProductsMaxDiscount: z
      .number({ message: 'Max diskon harus angka' })
      .min(0)
      .nullable(),
    items: z.array(discountVariantItemFormSchema),
  })
  .superRefine((data, ctx) => {
    if (data.scope === DiscountScope.AllProducts) {
      if (data.allProductsPercent == null || data.allProductsPercent <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Persentase diskon wajib diisi untuk mode semua produk',
          path: ['allProductsPercent'],
        });
      }
    } else {
      if (data.items.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Minimal pilih satu varian untuk diskon',
          path: ['items'],
        });
      }

      data.items.forEach((item, index) => {
        const hasValue = item.value != null && item.value > 0;
        const hasMax =
          item.valueType === DiscountItemValueType.Percent &&
          item.maxDiscount != null &&
          item.maxDiscount > 0;

        if (!hasValue && !hasMax) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Wajib isi nilai diskon atau max diskon',
            path: ['items', index, 'value'],
          });
        }

        if (
          item.valueType === DiscountItemValueType.Percent &&
          item.value != null &&
          item.value > 100
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Persentase tidak boleh lebih dari 100',
            path: ['items', index, 'value'],
          });
        }

        if (
          item.valueType === DiscountItemValueType.Fixed &&
          item.basePrice != null &&
          item.value != null &&
          item.value >= item.basePrice
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Nominal diskon tidak boleh lebih besar dari harga dasar',
            path: ['items', index, 'value'],
          });
        }

        if (
          item.promoStock != null &&
          item.stock != null &&
          item.promoStock > item.stock
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Promo stock melebihi stok varian',
            path: ['items', index, 'promoStock'],
          });
        }

        if (
          item.purchaseLimit != null &&
          item.promoStock != null &&
          item.purchaseLimit > item.promoStock
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Batas pembelian melebihi promo stock',
            path: ['items', index, 'purchaseLimit'],
          });
        }
      });
    }

    if (!data.noExpiry) {
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
    }

    if (!data.isEcommerce && !data.isPos) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Pilih minimal satu channel (E-commerce atau POS)',
        path: ['isEcommerce'],
      });
    }
  });

export type DiscountFormValues = z.infer<typeof discountFormSchema>;

export const defaultDiscountFormValues: DiscountFormValues = {
  name: '',
  code: '',
  description: '',
  scope: DiscountScope.Product,
  isActive: true,
  isEcommerce: true,
  isPos: false,
  startedAt: null,
  expiredAt: null,
  noExpiry: false,
  daysOfWeek: [],
  allProductsPercent: null,
  allProductsMaxDiscount: null,
  items: [],
};
