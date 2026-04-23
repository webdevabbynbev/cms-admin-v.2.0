import { describe, it, expect } from 'vitest';
import { normalizePickRecord } from './normalize';

describe('normalizePickRecord', () => {
  it('returns defaults for empty object', () => {
    expect(normalizePickRecord({})).toEqual({
      id: 0,
      order: 0,
      isActive: false,
      productId: 0,
      startDate: null,
      endDate: null,
      product: null,
    });
  });

  it('reads camelCase fields', () => {
    const result = normalizePickRecord({
      id: 10,
      order: 3,
      isActive: true,
      productId: 99,
      startDate: '2026-04-01',
      endDate: '2026-04-30',
    });
    expect(result).toEqual({
      id: 10,
      order: 3,
      isActive: true,
      productId: 99,
      startDate: '2026-04-01',
      endDate: '2026-04-30',
      product: null,
    });
  });

  it('reads snake_case fallbacks', () => {
    const result = normalizePickRecord({
      is_active: true,
      product_id: 50,
      start_date: '2026-01-01',
      end_date: '2026-12-31',
    });
    expect(result.isActive).toBe(true);
    expect(result.productId).toBe(50);
    expect(result.startDate).toBe('2026-01-01');
    expect(result.endDate).toBe('2026-12-31');
  });

  it('isActive defaults to false when absent', () => {
    expect(normalizePickRecord({}).isActive).toBe(false);
  });

  it('normalizes nested product with brand + categoryType', () => {
    const result = normalizePickRecord({
      id: 1,
      product: {
        id: 42,
        name: 'Serum',
        masterSku: 'SER-1',
        brand: { name: 'Abby' },
        categoryType: { name: 'Skincare' },
        medias: [],
        variants: [],
      },
    });
    expect(result.product).toEqual({
      id: 42,
      name: 'Serum',
      masterSku: 'SER-1',
      imageUrl: null,
      brandName: 'Abby',
      categoryTypeName: 'Skincare',
      totalStock: 0,
    });
  });

  it('product reads snake_case master_sku + category_type', () => {
    const result = normalizePickRecord({
      product: {
        id: 1,
        name: 'X',
        master_sku: 'X-1',
        category_type: { name: 'Hair' },
      },
    });
    expect(result.product?.masterSku).toBe('X-1');
    expect(result.product?.categoryTypeName).toBe('Hair');
  });

  it('product imageUrl: prefers first media with type=1 (image)', () => {
    const result = normalizePickRecord({
      product: {
        id: 1,
        name: 'X',
        medias: [
          { type: 2, url: 'http://video.mp4' },
          { type: 1, url: 'http://img.jpg' },
          { type: 1, url: 'http://img2.jpg' },
        ],
      },
    });
    expect(result.product?.imageUrl).toBe('http://img.jpg');
  });

  it('product imageUrl: accepts string type "image"', () => {
    const result = normalizePickRecord({
      product: {
        id: 1,
        name: 'X',
        medias: [
          { type: 'video', url: 'http://video.mp4' },
          { type: 'image', url: 'http://pic.jpg' },
        ],
      },
    });
    expect(result.product?.imageUrl).toBe('http://pic.jpg');
  });

  it('product imageUrl: falls back to first media url when no type matches', () => {
    const result = normalizePickRecord({
      product: {
        id: 1,
        name: 'X',
        medias: [
          { type: 5, url: 'http://first.jpg' },
          { type: 6, url: 'http://second.jpg' },
        ],
      },
    });
    expect(result.product?.imageUrl).toBe('http://first.jpg');
  });

  it('product imageUrl: null for empty medias', () => {
    const result = normalizePickRecord({
      product: { id: 1, name: 'X', medias: [] },
    });
    expect(result.product?.imageUrl).toBeNull();
  });

  it('product totalStock: sums variant stocks', () => {
    const result = normalizePickRecord({
      product: {
        id: 1,
        name: 'X',
        variants: [
          { stock: 5 },
          { stock: 10 },
          { stock: 3 },
        ],
      },
    });
    expect(result.product?.totalStock).toBe(18);
  });

  it('product totalStock: coerces numeric strings and handles missing stock', () => {
    const result = normalizePickRecord({
      product: {
        id: 1,
        name: 'X',
        variants: [{ stock: '7' }, { stock: null }, {}],
      },
    });
    expect(result.product?.totalStock).toBe(7);
  });

  it('product totalStock: zero when variants not array', () => {
    expect(
      normalizePickRecord({ product: { id: 1, name: 'X', variants: null } })
        .product?.totalStock,
    ).toBe(0);
  });

  it('product brandName null when brand missing', () => {
    const result = normalizePickRecord({
      product: { id: 1, name: 'X' },
    });
    expect(result.product?.brandName).toBeNull();
    expect(result.product?.categoryTypeName).toBeNull();
  });

  it('product is null when raw.product absent', () => {
    expect(normalizePickRecord({ id: 1 }).product).toBeNull();
  });
});
