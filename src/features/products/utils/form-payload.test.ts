import { describe, it, expect } from 'vitest';
import {
  applyDuplicateTransform,
  buildProductPayload,
  productDetailToFormValues,
} from './form-payload';
import { defaultProductFormValues } from '../schemas';
import { MediaType, ProductStatus } from '../types';
import type { ProductDetail, ProductVariant } from '../types';
import type { ProductFormValues } from '../schemas';

function formValues(overrides: Partial<ProductFormValues> = {}): ProductFormValues {
  return { ...defaultProductFormValues, ...overrides };
}

function variant(overrides: Partial<ProductVariant> = {}): ProductVariant {
  return {
    price: 0,
    stock: 0,
    sku: '',
    combination: [],
    ...overrides,
  };
}

describe('buildProductPayload — single variant mode', () => {
  it('emits one variant row from top-level fields when has_variants=false', () => {
    const payload = buildProductPayload(
      formValues({
        name: 'Lipstick',
        price: 100000,
        base_price: 120000,
        stock: 50,
        weight: 15,
        barcode: '8991111',
        sku_variant_1: 'LIP-001',
      }),
    );
    expect((payload.variants as unknown[])).toHaveLength(1);
    expect((payload.variants as Array<Record<string, unknown>>)[0]).toMatchObject({
      combination: [],
      price: 100000,
      base_price: 120000,
      stock: 50,
      weight: 15,
      barcode: '8991111',
      sku_variant_1: 'LIP-001',
    });
  });

  it('preserves existing variant id when editing single-variant product', () => {
    const existing = { variants: [{ id: 555 }] } as unknown as ProductDetail;
    const payload = buildProductPayload(formValues(), existing);
    expect((payload.variants as Array<{ id?: number }>)[0].id).toBe(555);
  });

  it('omits bpom when empty string', () => {
    const payload = buildProductPayload(formValues({ bpom: '' }));
    expect((payload.variants as Array<Record<string, unknown>>)[0].bpom).toBeUndefined();
    expect(payload.bpom).toBeUndefined();
  });
});

describe('buildProductPayload — multi-variant mode', () => {
  it('maps each variant row with all extended attrs', () => {
    const payload = buildProductPayload(
      formValues({
        has_variants: true,
        variants: [
          {
            id: 1,
            combination: [10, 20],
            display: ['Red', 'Large'],
            display_name: 'Red / Large',
            base_price: 100000,
            price: 90000,
            stock: 5,
            sku: 'SKU-A',
            sku_variant_1: 'SKU-A-VAR',
            barcode: '123',
            weight: 10,
            bpom: 'NA001',
            photo_variant: 'http://x/y.jpg',
            skintone: 'fair',
            undertone: 'cool',
            finish: 'matte',
            warna: 'red',
            perfume_for: 'women',
            main_accords: ['Floral', 'Woody'],
            top_notes: ['Bergamot'],
            middle_notes: ['Rose'],
            base_notes: ['Musk'],
          },
        ],
      }),
    );
    const v = (payload.variants as Array<Record<string, unknown>>)[0];
    expect(v).toMatchObject({
      id: 1,
      combination: [10, 20],
      price: 90000,
      base_price: 100000,
      stock: 5,
      sku: 'SKU-A',
      sku_variant_1: 'SKU-A-VAR',
      barcode: '123',
      weight: 10,
      bpom: 'NA001',
      photo_variant: 'http://x/y.jpg',
      skintone: 'fair',
      finish: 'matte',
      main_accords: 'Floral, Woody',
      top_notes: 'Bergamot',
      middle_notes: 'Rose',
      base_notes: 'Musk',
    });
  });

  it('omits empty string fields on variant (sku, bpom, skintone, etc.)', () => {
    const payload = buildProductPayload(
      formValues({
        has_variants: true,
        variants: [
          {
            ...formValues().variants[0],
            id: 1,
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
          },
        ],
      }),
    );
    const v = (payload.variants as Array<Record<string, unknown>>)[0];
    expect(v.sku).toBeUndefined();
    expect(v.bpom).toBeUndefined();
    expect(v.skintone).toBeUndefined();
    expect(v.main_accords).toBeUndefined();
    expect(v.photo_variant).toBeUndefined();
  });
});

describe('buildProductPayload — category handling', () => {
  it('uses category_type_ids when populated', () => {
    const payload = buildProductPayload(
      formValues({ category_type_id: 999, category_type_ids: [1, 2, 3] }),
    );
    expect(payload.category_type_id).toBe(1);
    expect(payload.category_type_ids).toEqual([1, 2, 3]);
  });

  it('falls back to single category_type_id when plural is empty', () => {
    const payload = buildProductPayload(
      formValues({ category_type_id: 42, category_type_ids: [] }),
    );
    expect(payload.category_type_id).toBe(42);
    expect(payload.category_type_ids).toEqual([42]);
  });

  it('emits nulls/empty when no category selected', () => {
    const payload = buildProductPayload(
      formValues({ category_type_id: null, category_type_ids: [] }),
    );
    expect(payload.category_type_id).toBeNull();
    expect(payload.category_type_ids).toEqual([]);
  });
});

describe('buildProductPayload — product-level CSV joining', () => {
  it('joins arrays with ", " for main_accords/notes/warna', () => {
    const payload = buildProductPayload(
      formValues({
        main_accords: ['Floral', 'Citrus'],
        top_notes: ['Lemon'],
        warna: ['Red', 'Pink'],
      }),
    );
    expect(payload.main_accords).toBe('Floral, Citrus');
    expect(payload.top_notes).toBe('Lemon');
    expect(payload.warna).toBe('Red, Pink');
  });

  it('omits CSV fields when empty', () => {
    const payload = buildProductPayload(
      formValues({ main_accords: [], top_notes: [], warna: [] }),
    );
    expect(payload.main_accords).toBeUndefined();
    expect(payload.top_notes).toBeUndefined();
    expect(payload.warna).toBeUndefined();
  });
});

describe('applyDuplicateTransform', () => {
  it('appends (Copy) to name', () => {
    expect(applyDuplicateTransform(formValues({ name: 'Lipstick' })).name).toBe(
      'Lipstick (Copy)',
    );
  });

  it('clears master_sku and sets status to Draft', () => {
    const result = applyDuplicateTransform(
      formValues({ name: 'X', master_sku: 'SKU-001', status: ProductStatus.Normal }),
    );
    expect(result.master_sku).toBe('');
    expect(result.status).toBe(ProductStatus.Draft);
  });

  it('clears variant ids/skus/barcodes', () => {
    const result = applyDuplicateTransform(
      formValues({
        has_variants: true,
        variants: [
          {
            ...formValues().variants[0],
            id: 10,
            combination: [1],
            display: ['a'],
            display_name: 'a',
            base_price: 100,
            price: 90,
            stock: 5,
            sku: 'KEEP',
            sku_variant_1: 'KEEP2',
            barcode: 'BAR',
            weight: 1,
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
          },
        ],
      }),
    );
    expect(result.variants[0].id).toBeUndefined();
    expect(result.variants[0].sku).toBe('');
    expect(result.variants[0].sku_variant_1).toBe('');
    expect(result.variants[0].barcode).toBe('');
  });

  it('handles empty-name input', () => {
    expect(applyDuplicateTransform(formValues({ name: '' })).name).toBe('');
  });
});

function detail(overrides: Partial<ProductDetail> = {}): ProductDetail {
  return {
    id: 1,
    name: '',
    slug: '',
    masterSku: '',
    isFlashSale: false,
    status: ProductStatus.Normal,
    position: 0,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...overrides,
  } as ProductDetail;
}

describe('productDetailToFormValues', () => {
  it('detects single-variant mode when one variant with no combination', () => {
    const result = productDetailToFormValues(
      detail({
        variants: [
          variant({
            id: 1,
            price: 100000,
            stock: 10,
            basePrice: 120000,
            weight: 5,
            barcode: 'BAR',
            skuVariant1: 'SKU-1',
          }),
        ],
      }),
    );
    expect(result.has_variants).toBe(false);
    expect(result.price).toBe(100000);
    expect(result.stock).toBe(10);
    expect(result.base_price).toBe(120000);
    expect(result.barcode).toBe('BAR');
    expect(result.variants).toEqual([]);
  });

  it('detects multi-variant when >1 variant or any has combination', () => {
    const twoVariants = productDetailToFormValues(
      detail({
        variants: [variant({ id: 1 }), variant({ id: 2 })],
      }),
    );
    expect(twoVariants.has_variants).toBe(true);
    expect(twoVariants.variants).toHaveLength(2);

    const oneWithCombo = productDetailToFormValues(
      detail({ variants: [variant({ id: 1, combination: [10, 20] })] }),
    );
    expect(oneWithCombo.has_variants).toBe(true);
  });

  it('extracts category ids from any of the 5 shapes', () => {
    const fromSingle = productDetailToFormValues(detail({ categoryTypeId: 1 }));
    expect(fromSingle.category_type_ids).toEqual([1]);

    const fromSnakePlural = productDetailToFormValues(
      detail({ category_type_ids: [2, 3] } as Partial<ProductDetail>),
    );
    expect(fromSnakePlural.category_type_ids).toEqual([2, 3]);

    const fromCategoryObjects = productDetailToFormValues(
      detail({ categoryTypes: [{ id: 5 }, { id: 6 }] } as Partial<ProductDetail>),
    );
    expect(fromCategoryObjects.category_type_ids).toEqual([5, 6]);
  });

  it('dedupes ids across multiple category sources', () => {
    const result = productDetailToFormValues(
      detail({
        categoryTypeId: 1,
        category_type_ids: [1, 2],
        categoryTypes: [{ id: 2 }, { id: 3 }],
      } as Partial<ProductDetail>),
    );
    expect(result.category_type_ids).toEqual([1, 2, 3]);
  });

  it('extracts concern ids with fallback chain', () => {
    expect(
      productDetailToFormValues(
        detail({ concern_option_ids: [1, 2] } as Partial<ProductDetail>),
      ).concern_option_ids,
    ).toEqual([1, 2]);

    expect(
      productDetailToFormValues(
        detail({ concernOptions: [{ id: 10 }, { id: 20 }] } as Partial<ProductDetail>),
      ).concern_option_ids,
    ).toEqual([10, 20]);
  });

  it('filters variant-level media from product-level medias', () => {
    const result = productDetailToFormValues(
      detail({
        medias: [
          { url: 'a.jpg', type: MediaType.Image, variantId: null },
          { url: 'b.jpg', type: MediaType.Image, variantId: 10 },
          { url: 'c.mp4', type: MediaType.Video },
        ] as ProductDetail['medias'],
      }),
    );
    expect(result.medias).toHaveLength(2);
    expect(result.medias.map((m) => m.url)).toEqual(['a.jpg', 'c.mp4']);
  });

  it('splits comma-separated accord/notes into arrays', () => {
    const result = productDetailToFormValues(
      detail({
        mainAccords: 'Floral, Citrus, Woody',
        topNotes: 'Bergamot',
        warna: 'Red, Pink',
      } as Partial<ProductDetail>),
    );
    expect(result.main_accords).toEqual(['Floral', 'Citrus', 'Woody']);
    expect(result.top_notes).toEqual(['Bergamot']);
    expect(result.warna).toEqual(['Red', 'Pink']);
  });

  it('handles already-array accord fields', () => {
    const result = productDetailToFormValues(
      detail({ mainAccords: ['Floral', 'Woody'] } as unknown as Partial<ProductDetail>),
    );
    expect(result.main_accords).toEqual(['Floral', 'Woody']);
  });

  it('coerces metaAi to boolean', () => {
    expect(productDetailToFormValues(detail({ metaAi: true })).meta_ai).toBe(true);
    expect(productDetailToFormValues(detail({ metaAi: null })).meta_ai).toBe(false);
    expect(productDetailToFormValues(detail({})).meta_ai).toBe(false);
  });

  it('falls back to firstVariant.bpom when product-level bpom missing', () => {
    const result = productDetailToFormValues(
      detail({
        bpom: null,
        variants: [variant({ id: 1, bpom: 'NA-99' })],
      }),
    );
    expect(result.bpom).toBe('NA-99');
  });
});
