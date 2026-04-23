import { describe, it, expect } from 'vitest';
import { buildFlashSalePayload } from './build-payload';
import { defaultFlashSaleFormValues, type FlashSaleVariantFormValues } from '../schemas';

function variant(
  overrides: Partial<FlashSaleVariantFormValues> = {},
): FlashSaleVariantFormValues {
  return {
    variantId: 1,
    productId: 10,
    productName: 'Product',
    sku: null,
    image: null,
    label: '',
    basePrice: 100000,
    baseStock: 100,
    flashPrice: 80000,
    flashStock: 50,
    isActive: true,
    ...overrides,
  };
}

describe('buildFlashSalePayload', () => {
  it('trims title and description', () => {
    const payload = buildFlashSalePayload({
      ...defaultFlashSaleFormValues,
      title: '  Big Sale  ',
      description: '  some desc  ',
      startDatetime: '2026-04-20T00:00',
      endDatetime: '2026-04-30T00:00',
      variants: [variant()],
    });
    expect(payload.title).toBe('Big Sale');
    expect(payload.description).toBe('some desc');
  });

  it('returns null description when trimmed empty', () => {
    const payload = buildFlashSalePayload({
      ...defaultFlashSaleFormValues,
      description: '   ',
      variants: [variant()],
    });
    expect(payload.description).toBeNull();
  });

  it('clears button fields when hasButton=false', () => {
    const payload = buildFlashSalePayload({
      ...defaultFlashSaleFormValues,
      hasButton: false,
      buttonText: 'Beli',
      buttonUrl: 'https://x',
      variants: [variant()],
    });
    expect(payload.button_text).toBeNull();
    expect(payload.button_url).toBeNull();
    expect(payload.has_button).toBe(false);
  });

  it('preserves trimmed button fields when hasButton=true', () => {
    const payload = buildFlashSalePayload({
      ...defaultFlashSaleFormValues,
      hasButton: true,
      buttonText: '  Beli  ',
      buttonUrl: '  https://x  ',
      variants: [variant()],
    });
    expect(payload.button_text).toBe('Beli');
    expect(payload.button_url).toBe('https://x');
  });

  it('converts WIB datetime-local to UTC ISO', () => {
    const payload = buildFlashSalePayload({
      ...defaultFlashSaleFormValues,
      startDatetime: '2026-04-20T12:30',
      endDatetime: '2026-04-30T18:00',
      variants: [variant()],
    });
    // 12:30 WIB = 05:30 UTC; 18:00 WIB = 11:00 UTC
    expect(payload.start_datetime).toBe('2026-04-20T05:30:00.000Z');
    expect(payload.end_datetime).toBe('2026-04-30T11:00:00.000Z');
  });

  it('passes through invalid datetime strings unchanged', () => {
    const payload = buildFlashSalePayload({
      ...defaultFlashSaleFormValues,
      startDatetime: '',
      endDatetime: 'garbage',
      variants: [variant()],
    });
    expect(payload.start_datetime).toBe('');
    expect(payload.end_datetime).toBe('garbage');
  });

  it('filters inactive variants from payload', () => {
    const payload = buildFlashSalePayload({
      ...defaultFlashSaleFormValues,
      variants: [
        variant({ variantId: 1, isActive: true }),
        variant({ variantId: 2, isActive: false }),
        variant({ variantId: 3, isActive: true }),
      ],
    });
    expect(payload.variants.map((v) => v.variant_id)).toEqual([1, 3]);
  });

  it('assigns position sequentially starting at 1 after filtering', () => {
    const payload = buildFlashSalePayload({
      ...defaultFlashSaleFormValues,
      variants: [
        variant({ variantId: 1, isActive: false }),
        variant({ variantId: 2, isActive: true }),
        variant({ variantId: 3, isActive: true }),
      ],
    });
    expect(payload.variants).toEqual([
      { variant_id: 2, flash_price: 80000, stock: 50, position: 1 },
      { variant_id: 3, flash_price: 80000, stock: 50, position: 2 },
    ]);
  });

  it('returns empty variants array when none active', () => {
    const payload = buildFlashSalePayload({
      ...defaultFlashSaleFormValues,
      variants: [variant({ isActive: false })],
    });
    expect(payload.variants).toEqual([]);
  });
});
