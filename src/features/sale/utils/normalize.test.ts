import { describe, it, expect } from 'vitest';
import { normalizeSale, normalizeSaleDetail, normalizeSaleVariant } from './normalize';

describe('normalizeSale', () => {
  it('reads title/description/dates from camelCase + snake_case', () => {
    expect(
      normalizeSale({
        id: 1,
        title: 'Raya Sale',
        description: 'Big one',
        start_datetime: '2026-04-01T00:00:00Z',
        end_datetime: '2026-04-30T23:59:59Z',
        is_publish: true,
      }),
    ).toMatchObject({
      id: 1,
      title: 'Raya Sale',
      description: 'Big one',
      startDatetime: '2026-04-01T00:00:00Z',
      endDatetime: '2026-04-30T23:59:59Z',
      isPublish: true,
    });
  });

  it('counts variants array length', () => {
    expect(normalizeSale({ id: 1, variants: [{}, {}, {}] }).variantCount).toBe(3);
  });

  it('counts products array when variants absent', () => {
    expect(normalizeSale({ id: 1, products: [{}, {}] }).variantCount).toBe(2);
  });

  it('defaults null/0 for empty input', () => {
    expect(normalizeSale({})).toMatchObject({
      id: 0,
      title: null,
      description: null,
      variantCount: 0,
      isPublish: false,
      hasButton: false,
      buttonText: null,
      buttonUrl: null,
    });
  });

  it('reads button fields via both casings', () => {
    const result = normalizeSale({
      has_button: true,
      button_text: 'Beli',
      button_url: 'https://x',
    });
    expect(result).toMatchObject({
      hasButton: true,
      buttonText: 'Beli',
      buttonUrl: 'https://x',
    });
  });
});

describe('normalizeSaleVariant', () => {
  it('reads pivot.sale_price and pivot.stock', () => {
    const result = normalizeSaleVariant({
      id: 1,
      price: 100000,
      stock: 50,
      pivot: { sale_price: 75000, stock: 10 },
      product: { id: 99, name: 'Foundation' },
    });
    expect(result).toMatchObject({
      variantId: 1,
      productId: 99,
      productName: 'Foundation',
      basePrice: 100000,
      baseStock: 50,
      salePrice: 75000,
      saleStock: 10,
    });
  });

  it('falls back to base price/stock when no sale_price/stock pivot', () => {
    const result = normalizeSaleVariant({
      id: 1,
      price: 100000,
      stock: 20,
      product: { id: 2, name: 'X' },
    });
    expect(result.salePrice).toBe(100000);
    expect(result.saleStock).toBe(20);
  });

  it('builds variant label from variantLabel field', () => {
    expect(
      normalizeSaleVariant({ id: 1, variant_label: 'Red / Large' }).variantLabel,
    ).toBe('Red / Large');
  });

  it('builds variant label from attributes array', () => {
    const result = normalizeSaleVariant({
      id: 1,
      attributes: [
        { attribute: { name: 'Color' }, value: 'Red' },
        { attribute: { name: 'Size' }, value: 'L' },
      ],
    });
    expect(result.variantLabel).toBe('Color: Red, Size: L');
  });

  it('falls back label to sku then barcode', () => {
    expect(normalizeSaleVariant({ id: 1, sku: 'SKU-1' }).variantLabel).toBe('SKU-1');
    expect(normalizeSaleVariant({ id: 1, barcode: 'BAR-1' }).variantLabel).toBe(
      'BAR-1',
    );
  });

  it('picks first image of type=1 (image) from product.medias', () => {
    const result = normalizeSaleVariant({
      id: 1,
      product: {
        id: 1,
        name: 'Foundation',
        medias: [
          { type: 2, url: 'video.mp4' },
          { type: 1, url: 'first-image.jpg' },
          { type: 1, url: 'second-image.jpg' },
        ],
      },
    });
    expect(result.imageUrl).toBe('first-image.jpg');
  });

  it('falls back to first media url when no image-type media', () => {
    const result = normalizeSaleVariant({
      id: 1,
      product: { id: 1, name: 'X', medias: [{ type: 2, url: 'video.mp4' }] },
    });
    expect(result.imageUrl).toBe('video.mp4');
  });

  it('returns null imageUrl when no media present', () => {
    expect(
      normalizeSaleVariant({ id: 1, product: { id: 1, name: 'X' } }).imageUrl,
    ).toBeNull();
  });

  it('reads productName from root camelCase when product.name absent', () => {
    expect(
      normalizeSaleVariant({ id: 1, productName: 'Bare' }).productName,
    ).toBe('Bare');
  });
});

describe('normalizeSaleDetail', () => {
  it('combines sale header + normalized variants', () => {
    const result = normalizeSaleDetail({
      id: 5,
      title: 'Sale',
      variants: [
        { id: 1, price: 100, stock: 1, pivot: { sale_price: 80, stock: 5 } },
      ],
    });
    expect(result.id).toBe(5);
    expect(result.variants).toHaveLength(1);
    expect(result.variants[0]).toMatchObject({
      variantId: 1,
      salePrice: 80,
      saleStock: 5,
    });
  });

  it('returns empty variants when field missing', () => {
    expect(normalizeSaleDetail({ id: 1 }).variants).toEqual([]);
  });
});
