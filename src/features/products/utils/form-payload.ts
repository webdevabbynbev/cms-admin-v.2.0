import { MediaType, ProductStatus } from '../types';
import type { ProductDetail, ProductMedia, ProductVariant } from '../types';
import type { MediaFormValue, ProductFormValues, VariantFormValues } from '../schemas';
import { defaultProductFormValues, defaultVariantFormValues } from '../schemas';

// Comma-separated API string ↔ string array in form.
function toArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.map((s) => String(s).trim()).filter(Boolean);
  const str = String(val ?? '').trim();
  if (!str) return [];
  return str.split(',').map((s) => s.trim()).filter(Boolean);
}

function joinCsv(arr: string[] | undefined): string {
  if (!arr || arr.length === 0) return '';
  return arr.join(', ');
}

function buildVariantPayload(variant: VariantFormValues) {
  return {
    id: variant.id,
    combination: variant.combination,
    price: variant.price,
    base_price: variant.base_price,
    stock: variant.stock,
    sku: variant.sku || undefined,
    sku_variant_1: variant.sku_variant_1,
    barcode: variant.barcode,
    weight: variant.weight,
    bpom: variant.bpom || undefined,
    photo_variant: variant.photo_variant ?? undefined,
    skintone: variant.skintone || undefined,
    undertone: variant.undertone || undefined,
    finish: variant.finish || undefined,
    warna: variant.warna || undefined,
    perfume_for: variant.perfume_for || undefined,
    main_accords: joinCsv(variant.main_accords) || undefined,
    top_notes: joinCsv(variant.top_notes) || undefined,
    middle_notes: joinCsv(variant.middle_notes) || undefined,
    base_notes: joinCsv(variant.base_notes) || undefined,
  };
}

export function buildProductPayload(
  values: ProductFormValues,
  existing?: ProductDetail | null,
): Record<string, unknown> {
  const existingVariant = existing?.variants?.[0];

  const variantsPayload = values.has_variants
    ? values.variants.map(buildVariantPayload)
    : [
        {
          id: existingVariant?.id,
          combination: [],
          price: values.price,
          base_price: values.base_price,
          stock: values.stock,
          sku_variant_1: values.sku_variant_1,
          barcode: values.barcode,
          weight: values.weight,
          bpom: values.bpom || undefined,
        },
      ];

  const categoryIds =
    values.category_type_ids.length > 0
      ? values.category_type_ids
      : values.category_type_id != null
        ? [values.category_type_id]
        : [];

  return {
    name: values.name,
    description: values.description,
    master_sku: values.master_sku,
    status: values.status,
    is_flashsale: values.is_flashsale,
    is_gift: values.is_gift,
    is_visible_ecommerce: values.is_visible_ecommerce,
    base_price: values.base_price,
    weight: values.weight,
    brand_id: values.brand_id,
    persona_id: values.persona_id,

    // Backend accepts both singular (first) + plural (all)
    category_type_id: categoryIds.length > 0 ? categoryIds[0] : null,
    category_type_ids: categoryIds,

    concern_option_ids: values.concern_option_ids,
    profile_category_option_ids: values.profile_category_option_ids,

    how_to_use: values.how_to_use || undefined,
    ingredients: values.ingredients || undefined,
    bpom: values.bpom || undefined,

    main_accords: joinCsv(values.main_accords) || undefined,
    top_notes: joinCsv(values.top_notes) || undefined,
    middle_notes: joinCsv(values.middle_notes) || undefined,
    base_notes: joinCsv(values.base_notes) || undefined,
    perfume_for: values.perfume_for || undefined,
    finish: values.finish || undefined,
    warna: joinCsv(values.warna) || undefined,

    medias: values.medias,
    meta_title: values.meta_title,
    meta_description: values.meta_description,
    meta_keywords: values.meta_keywords,
    variants: variantsPayload,
  };
}

function mediaToFormValue(media: ProductMedia): MediaFormValue {
  const type = media.type === MediaType.Video ? MediaType.Video : MediaType.Image;
  return { url: media.url, type };
}

function deriveVariantDisplayName(variant: ProductVariant, index: number): string {
  if (variant.skuVariant1) return variant.skuVariant1;
  if (variant.sku) return variant.sku;
  return `Variant ${index + 1}`;
}

function variantToFormValue(variant: ProductVariant, index: number): VariantFormValues {
  return {
    ...defaultVariantFormValues,
    id: variant.id,
    combination: (variant.combination ?? []).map((c) => Number(c)).filter((n) => Number.isFinite(n)),
    display: [],
    display_name: deriveVariantDisplayName(variant, index),
    base_price: Number(variant.basePrice ?? variant.price ?? 0),
    price: Number(variant.price ?? 0),
    stock: Number(variant.stock ?? 0),
    sku: variant.sku ?? '',
    sku_variant_1: variant.skuVariant1 ?? '',
    barcode: variant.barcode ?? '',
    weight: Number(variant.weight ?? 0),
    bpom: variant.bpom ?? '',
    photo_variant: variant.photoVariant ?? null,
    skintone: variant.skintone ?? '',
    undertone: variant.undertone ?? '',
    finish: variant.finish ?? '',
    warna: variant.warna ?? '',
    perfume_for: variant.perfumeFor ?? '',
    main_accords: variant.mainAccords ?? [],
    top_notes: variant.topNotes ?? [],
    middle_notes: variant.middleNotes ?? [],
    base_notes: variant.baseNotes ?? [],
  };
}

function extractCategoryIds(detail: ProductDetail): number[] {
  const ids = new Set<number>();
  const add = (raw: unknown) => {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) ids.add(n);
  };
  if (detail.categoryTypeId != null) add(detail.categoryTypeId);
  detail.category_type_ids?.forEach(add);
  detail.categoryTypeIds?.forEach(add);
  detail.categoryTypes?.forEach((c) => add(c?.id));
  detail.category_types?.forEach((c) => add(c?.id));
  return Array.from(ids);
}

function extractConcernIds(detail: ProductDetail): number[] {
  if (detail.concern_option_ids?.length) return detail.concern_option_ids;
  if (detail.concernOptionIds?.length) return detail.concernOptionIds;
  if (detail.concernOptions?.length) return detail.concernOptions.map((c) => c.id);
  if (detail.concern_options?.length) return detail.concern_options.map((c) => c.id);
  return [];
}

function extractProfileIds(detail: ProductDetail): number[] {
  if (detail.profile_category_option_ids?.length) return detail.profile_category_option_ids;
  if (detail.profileCategoryOptionIds?.length) return detail.profileCategoryOptionIds;
  if (detail.profileOptions?.length) return detail.profileOptions.map((p) => p.id);
  if (detail.profile_category_options?.length)
    return detail.profile_category_options.map((p) => p.id);
  return [];
}

/**
 * Transform form values for duplicate mode — clear IDs, SKUs, barcodes so the backend
 * creates fresh records. Mark status as Draft and append " (Copy)" to the name.
 */
export function applyDuplicateTransform(values: ProductFormValues): ProductFormValues {
  return {
    ...values,
    name: values.name ? `${values.name} (Copy)` : '',
    master_sku: '',
    status: ProductStatus.Draft,
    variants: values.variants.map((v) => ({
      ...v,
      id: undefined,
      sku: '',
      sku_variant_1: '',
      barcode: '',
    })),
  };
}

export function productDetailToFormValues(detail: ProductDetail): ProductFormValues {
  const variants = detail.variants ?? [];
  const hasMulti = variants.length > 1 || variants.some((v) => (v.combination ?? []).length > 0);
  const firstVariant = variants[0];

  const categoryIds = extractCategoryIds(detail);

  return {
    ...defaultProductFormValues,
    name: detail.name ?? '',
    description: detail.description ?? '',
    master_sku: detail.masterSku ?? '',
    status: detail.status ?? defaultProductFormValues.status,
    is_flashsale: detail.isFlashSale ?? false,
    is_gift: detail.isGift ?? false,
    is_visible_ecommerce: detail.isVisibleEcommerce ?? true,
    base_price: Number(firstVariant?.basePrice ?? 0),
    weight: Number(firstVariant?.weight ?? 0),
    price: Number(firstVariant?.price ?? 0),
    stock: Number(firstVariant?.stock ?? 0),
    barcode: firstVariant?.barcode ?? '',
    sku_variant_1: firstVariant?.skuVariant1 ?? '',
    has_variants: hasMulti,
    attributes: [],
    variants: hasMulti ? variants.map(variantToFormValue) : [],
    medias: (detail.medias ?? []).filter((m) => !m.variantId).map(mediaToFormValue),
    brand_id: detail.brandId ?? null,
    persona_id: detail.personaId ?? null,
    category_type_id: categoryIds[0] ?? null,
    category_type_ids: categoryIds,
    concern_option_ids: extractConcernIds(detail),
    profile_category_option_ids: extractProfileIds(detail),
    how_to_use: detail.howToUse ?? '',
    ingredients: detail.ingredients ?? '',
    bpom: detail.bpom ?? firstVariant?.bpom ?? '',
    main_accords: toArray(detail.mainAccords),
    top_notes: toArray(detail.topNotes),
    middle_notes: toArray(detail.middleNotes),
    base_notes: toArray(detail.baseNotes),
    perfume_for: detail.perfumeFor ?? '',
    finish: detail.finish ?? '',
    warna: toArray(detail.warna),
    meta_title: detail.metaTitle ?? '',
    meta_description: detail.metaDescription ?? '',
    meta_keywords: detail.metaKeywords ?? '',
  };
}
