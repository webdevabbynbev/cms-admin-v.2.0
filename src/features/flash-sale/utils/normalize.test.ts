import { describe, it, expect } from 'vitest';
import {
  deriveFlashSaleStatus,
  normalizeFlashSale,
  toFlashSaleListItem,
} from './normalize';
import { FlashSaleStatus } from '../types';

describe('normalizeFlashSale', () => {
  it('returns defaults for empty input', () => {
    const result = normalizeFlashSale({});
    expect(result).toMatchObject({
      id: 0,
      title: '',
      description: null,
      hasButton: false,
      buttonText: null,
      buttonUrl: null,
      startDatetime: '',
      endDatetime: '',
      isPublish: false,
      order: 0,
      variants: [],
      createdAt: null,
      updatedAt: null,
    });
  });

  it('unwraps Adonis $attributes wrapper', () => {
    const result = normalizeFlashSale({
      $attributes: { id: 42, title: 'Hot Sale', isPublish: true },
    });
    expect(result.id).toBe(42);
    expect(result.title).toBe('Hot Sale');
    expect(result.isPublish).toBe(true);
  });

  it('reads camelCase + snake_case datetime fields', () => {
    const camel = normalizeFlashSale({
      startDatetime: '2026-04-20T00:00:00Z',
      endDatetime: '2026-04-30T00:00:00Z',
    });
    expect(camel.startDatetime).toBe('2026-04-20T00:00:00Z');
    expect(camel.endDatetime).toBe('2026-04-30T00:00:00Z');

    const snake = normalizeFlashSale({
      start_datetime: '2026-04-20T00:00:00Z',
      end_datetime: '2026-04-30T00:00:00Z',
    });
    expect(snake.startDatetime).toBe('2026-04-20T00:00:00Z');
    expect(snake.endDatetime).toBe('2026-04-30T00:00:00Z');
  });

  it('falls back to start_time/end_time keys', () => {
    const result = normalizeFlashSale({
      start_time: '2026-04-20T00:00:00Z',
      end_time: '2026-04-30T00:00:00Z',
    });
    expect(result.startDatetime).toBe('2026-04-20T00:00:00Z');
    expect(result.endDatetime).toBe('2026-04-30T00:00:00Z');
  });

  it('normalizes variants array (variant-level shape)', () => {
    const result = normalizeFlashSale({
      id: 1,
      variants: [
        {
          id: 10,
          variant_id: 100,
          product_id: 200,
          productName: 'Mascara',
          sku: 'MSC-01',
          flash_price: 50000,
          flash_stock: 10,
          base_price: 80000,
          base_stock: 100,
        },
      ],
    });
    expect(result.variants).toHaveLength(1);
    expect(result.variants[0]).toMatchObject({
      id: 10,
      variantId: 100,
      productId: 200,
      productName: 'Mascara',
      sku: 'MSC-01',
      flashPrice: 50000,
      flashStock: 10,
      basePrice: 80000,
      baseStock: 100,
    });
  });

  it('falls back to products[] when variants[] is empty', () => {
    const result = normalizeFlashSale({
      id: 2,
      variants: [],
      products: [
        {
          id: 300,
          name: 'Lipstick',
          price: 100000,
          stock: 50,
          pivot: {
            product_variant_id: 301,
            product_id: 300,
            flash_price: 70000,
            stock: 10,
          },
        },
      ],
    });
    expect(result.variants).toHaveLength(1);
    expect(result.variants[0]).toMatchObject({
      variantId: 301,
      productId: 300,
      productName: 'Lipstick',
      flashPrice: 70000,
      flashStock: 10,
      basePrice: 100000,
    });
  });

  it('reads pivot.product_id when variant has no explicit productId', () => {
    const result = normalizeFlashSale({
      products: [{ id: 500, pivot: { product_id: 500 } }],
    });
    expect(result.variants[0].productId).toBe(500);
  });

  it('reads product.id as fallback for variant.productId', () => {
    const result = normalizeFlashSale({
      variants: [{ variant_id: 1, product: { id: 99, name: 'Foundation' } }],
    });
    expect(result.variants[0].productId).toBe(99);
    expect(result.variants[0].productName).toBe('Foundation');
  });

  it('maps isPublish from is_publish or is_active', () => {
    expect(normalizeFlashSale({ is_publish: true }).isPublish).toBe(true);
    expect(normalizeFlashSale({ is_active: true }).isPublish).toBe(true);
  });

  it('returns empty variants when both lists missing', () => {
    expect(normalizeFlashSale({ id: 1 }).variants).toEqual([]);
  });
});

describe('deriveFlashSaleStatus', () => {
  it('returns Draft when not published', () => {
    expect(
      deriveFlashSaleStatus({
        isPublish: false,
        startDatetime: '2026-01-01',
        endDatetime: '2026-12-31',
      }),
    ).toBe(FlashSaleStatus.Draft);
  });

  it('returns Upcoming when start is in future', () => {
    const future = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
    const farFuture = new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString();
    expect(
      deriveFlashSaleStatus({
        isPublish: true,
        startDatetime: future,
        endDatetime: farFuture,
      }),
    ).toBe(FlashSaleStatus.Upcoming);
  });

  it('returns Ended when end is in past', () => {
    const past = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const morePast = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
    expect(
      deriveFlashSaleStatus({
        isPublish: true,
        startDatetime: morePast,
        endDatetime: past,
      }),
    ).toBe(FlashSaleStatus.Ended);
  });

  it('returns Active when now is between start and end', () => {
    const past = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const future = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    expect(
      deriveFlashSaleStatus({
        isPublish: true,
        startDatetime: past,
        endDatetime: future,
      }),
    ).toBe(FlashSaleStatus.Active);
  });
});

describe('toFlashSaleListItem', () => {
  it('adds status + totalVariants', () => {
    const base = normalizeFlashSale({
      id: 1,
      variants: [{ variant_id: 1 }, { variant_id: 2 }],
      is_publish: false,
    });
    const result = toFlashSaleListItem(base);
    expect(result.totalVariants).toBe(2);
    expect(result.status).toBe(FlashSaleStatus.Draft);
  });
});
