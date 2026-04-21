import { z } from 'zod';
import { ProductStatus } from '../types';

export const mediaFormSchema = z.object({
  url: z.string().min(1),
  type: z.union([z.literal(1), z.literal(2)]),
  slot: z.number().optional(),
});

export type MediaFormValue = z.infer<typeof mediaFormSchema>;

// Attribute row for the variant-matrix generator.
// value is the attribute_value table row id; label is what the user sees.
export const attributeValueOptionSchema = z.object({
  label: z.string(),
  value: z.number(),
});

export const attributeRowSchema = z.object({
  attribute_id: z.number().nullable(),
  values: z.array(attributeValueOptionSchema),
});

export type AttributeValueOption = z.infer<typeof attributeValueOptionSchema>;
export type AttributeRowValues = z.infer<typeof attributeRowSchema>;

export const variantFormSchema = z.object({
  id: z.number().optional(),
  // matrix linkage: combination is the list of attribute_value ids that define this row
  combination: z.array(z.number()),
  display: z.array(z.string()),

  display_name: z.string(),
  base_price: z.number().min(0, { message: 'Base price must be ≥ 0' }),
  price: z.number().min(0, { message: 'Price must be ≥ 0' }),
  stock: z.number().int().min(0, { message: 'Stock must be ≥ 0' }),
  sku: z.string(),
  sku_variant_1: z.string(),
  barcode: z.string(),
  weight: z.number().min(0, { message: 'Weight must be ≥ 0' }),

  bpom: z.string(),
  photo_variant: z.string().nullable(),

  // Extended per-variant attrs (conditionally used based on category)
  skintone: z.string(),
  undertone: z.string(),
  finish: z.string(),
  warna: z.string(),
  perfume_for: z.string(),
  main_accords: z.array(z.string()),
  top_notes: z.array(z.string()),
  middle_notes: z.array(z.string()),
  base_notes: z.array(z.string()),
});

export type VariantFormValues = z.infer<typeof variantFormSchema>;

export const defaultVariantFormValues: VariantFormValues = {
  combination: [],
  display: [],
  display_name: '',
  base_price: 0,
  price: 0,
  stock: 0,
  sku: '',
  sku_variant_1: '',
  barcode: '',
  weight: 0,
  bpom: '',
  photo_variant: null,
  skintone: '',
  undertone: '',
  finish: '',
  warna: '',
  perfume_for: '',
  main_accords: [],
  top_notes: [],
  middle_notes: [],
  base_notes: [],
};

export const productFormSchema = z
  .object({
    name: z
      .string()
      .min(1, { message: 'Product name is required' })
      .max(255, { message: 'Name is too long' }),

    description: z.string(),
    master_sku: z.string().min(1, { message: 'Master SKU is required' }),

    status: z.nativeEnum(ProductStatus),
    is_flashsale: z.boolean(),
    is_gift: z.boolean(),
    is_visible_ecommerce: z.boolean(),

    base_price: z.number().min(0, { message: 'Base price must be ≥ 0' }),
    weight: z.number().min(0, { message: 'Weight must be ≥ 0' }),

    // Single-variant fallback fields (used when has_variants = false)
    price: z.number().min(0, { message: 'Price must be ≥ 0' }),
    stock: z.number().int().min(0, { message: 'Stock must be ≥ 0' }),
    barcode: z.string(),
    sku_variant_1: z.string(),

    // Multi-variant structure
    has_variants: z.boolean(),
    attributes: z.array(attributeRowSchema),
    variants: z.array(variantFormSchema),

    medias: z
      .array(mediaFormSchema)
      .max(10, { message: 'Maximum 10 media files allowed' }),

    brand_id: z.number().nullable(),
    persona_id: z.number().nullable(),

    // Legacy single + multi category support. We write both on payload for backend compat.
    category_type_id: z.number().nullable(),
    category_type_ids: z.array(z.number()),
    concern_option_ids: z.array(z.number()),
    profile_category_option_ids: z.array(z.number()),

    // Product-level content
    how_to_use: z.string(),
    ingredients: z.string(),
    bpom: z.string(),

    // Product-level extended attrs (mirror variant-level for simple products)
    main_accords: z.array(z.string()),
    top_notes: z.array(z.string()),
    middle_notes: z.array(z.string()),
    base_notes: z.array(z.string()),
    perfume_for: z.string(),
    finish: z.string(),
    warna: z.array(z.string()),

    meta_title: z.string().max(255),
    meta_description: z.string().max(500),
    meta_keywords: z.string().max(500),
  })
  .superRefine((data, ctx) => {
    if (!data.has_variants) return;

    if (data.variants.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Multi-variant products must have at least 1 variant',
        path: ['variants'],
      });
    }

    const barcodes = data.variants
      .map((v, i) => ({ barcode: v.barcode.trim(), index: i }))
      .filter((v) => v.barcode !== '');
    const seenBarcodes = new Map<string, number>();
    for (const { barcode, index } of barcodes) {
      if (seenBarcodes.has(barcode)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Barcode must be unique across variants',
          path: ['variants', index, 'barcode'],
        });
      }
      seenBarcodes.set(barcode, index);
    }

    const skus = data.variants
      .map((v, i) => ({ sku: v.sku_variant_1.trim(), index: i }))
      .filter((v) => v.sku !== '');
    const seenSkus = new Map<string, number>();
    for (const { sku, index } of skus) {
      if (seenSkus.has(sku)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Variant SKU must be unique',
          path: ['variants', index, 'sku_variant_1'],
        });
      }
      seenSkus.set(sku, index);
    }
  });

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const defaultProductFormValues: ProductFormValues = {
  name: '',
  description: '',
  master_sku: '',
  status: ProductStatus.Draft,
  is_flashsale: false,
  is_gift: false,
  is_visible_ecommerce: true,
  base_price: 0,
  weight: 0,
  price: 0,
  stock: 0,
  barcode: '',
  sku_variant_1: '',
  has_variants: false,
  attributes: [],
  variants: [],
  medias: [],
  brand_id: null,
  persona_id: null,
  category_type_id: null,
  category_type_ids: [],
  concern_option_ids: [],
  profile_category_option_ids: [],
  how_to_use: '',
  ingredients: '',
  bpom: '',
  main_accords: [],
  top_notes: [],
  middle_notes: [],
  base_notes: [],
  perfume_for: '',
  finish: '',
  warna: [],
  meta_title: '',
  meta_description: '',
  meta_keywords: '',
};
