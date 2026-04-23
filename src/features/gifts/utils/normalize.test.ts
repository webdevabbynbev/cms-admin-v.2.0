import { describe, it, expect } from 'vitest';
import { normalizeGiftProduct } from './normalize';

describe('normalizeGiftProduct', () => {
  it('returns defaults for empty input', () => {
    expect(normalizeGiftProduct({})).toEqual({
      id: 0,
      brandId: null,
      brandName: null,
      productName: '',
      variantName: null,
      productVariantSku: null,
      productVariantId: null,
      isSellable: false,
      price: 0,
      stock: 0,
      weight: 0,
      imageUrl: null,
      isActive: true,
      createdAt: null,
      updatedAt: null,
    });
  });

  it('handles null/undefined raw input', () => {
    expect(normalizeGiftProduct(null).id).toBe(0);
    expect(normalizeGiftProduct(undefined).id).toBe(0);
  });

  it('reads camelCase fields', () => {
    const result = normalizeGiftProduct({
      id: 5,
      brandId: 2,
      brandName: 'Abby',
      productName: 'Gift Pack',
      variantName: 'Small',
      productVariantSku: 'GP-S',
      productVariantId: 101,
      isSellable: true,
      price: 150000,
      stock: 10,
      weight: 250,
      imageUrl: 'http://cdn/gp.jpg',
      isActive: false,
    });
    expect(result).toEqual({
      id: 5,
      brandId: 2,
      brandName: 'Abby',
      productName: 'Gift Pack',
      variantName: 'Small',
      productVariantSku: 'GP-S',
      productVariantId: 101,
      isSellable: true,
      price: 150000,
      stock: 10,
      weight: 250,
      imageUrl: 'http://cdn/gp.jpg',
      isActive: false,
      createdAt: null,
      updatedAt: null,
    });
  });

  it('reads snake_case fallbacks', () => {
    const result = normalizeGiftProduct({
      brand_id: 3,
      brand_name: 'Bev',
      product_name: 'Hamper',
      variant_name: 'Large',
      product_variant_sku: 'HM-L',
      product_variant_id: 202,
      is_sellable: true,
      image_url: 'http://cdn/hm.jpg',
      is_active: false,
      created_at: '2026-01-01',
      updated_at: '2026-01-02',
    });
    expect(result.brandId).toBe(3);
    expect(result.brandName).toBe('Bev');
    expect(result.productName).toBe('Hamper');
    expect(result.productVariantSku).toBe('HM-L');
    expect(result.productVariantId).toBe(202);
    expect(result.isSellable).toBe(true);
    expect(result.imageUrl).toBe('http://cdn/hm.jpg');
    expect(result.isActive).toBe(false);
  });

  it('productName reads `name` as third fallback', () => {
    expect(normalizeGiftProduct({ name: 'Legacy Name' }).productName).toBe(
      'Legacy Name',
    );
  });

  it('isSellable defaults to FALSE (unlike isActive which defaults true)', () => {
    expect(normalizeGiftProduct({}).isSellable).toBe(false);
  });

  it('isActive defaults to true when absent', () => {
    expect(normalizeGiftProduct({}).isActive).toBe(true);
  });

  it('brandId/productVariantId return null for empty string', () => {
    const result = normalizeGiftProduct({
      brandId: '',
      productVariantId: '',
    });
    expect(result.brandId).toBeNull();
    expect(result.productVariantId).toBeNull();
  });

  it('brandId/productVariantId coerce numeric strings', () => {
    const result = normalizeGiftProduct({
      brandId: '42',
      productVariantId: '100',
    });
    expect(result.brandId).toBe(42);
    expect(result.productVariantId).toBe(100);
  });

  it('brandId/productVariantId return null for non-numeric strings', () => {
    const result = normalizeGiftProduct({
      brandId: 'abc',
      productVariantId: 'xyz',
    });
    expect(result.brandId).toBeNull();
    expect(result.productVariantId).toBeNull();
  });

  it('price/stock/weight coerce numeric strings', () => {
    const result = normalizeGiftProduct({
      price: '99000',
      stock: '25',
      weight: '500',
    });
    expect(result.price).toBe(99000);
    expect(result.stock).toBe(25);
    expect(result.weight).toBe(500);
  });

  it('price/stock/weight fall back to 0 for non-numeric', () => {
    const result = normalizeGiftProduct({
      price: 'invalid',
      stock: undefined,
      weight: null,
    });
    expect(result.price).toBe(0);
    expect(result.stock).toBe(0);
    expect(result.weight).toBe(0);
  });
});
