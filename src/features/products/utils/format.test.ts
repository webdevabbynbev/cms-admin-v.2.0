import { describe, it, expect } from 'vitest';
import {
  formatPrice,
  getProductPrimaryImage,
  getProductTotalStock,
  hasSeoFilled,
} from './format';
import type { ProductListItem } from '../types';

const base: ProductListItem = {
  id: 1,
  name: 'P',
  slug: 'p',
  masterSku: null,
  status: 'active',
  stock: 0,
  price: 0,
  isFlashsale: false,
  brand: null,
  categoryType: null,
  medias: [],
  variants: [],
  metaTitle: null,
  metaDescription: null,
  metaKeywords: null,
} as unknown as ProductListItem;

const idr = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);

describe('formatPrice', () => {
  it('formats number/string as IDR currency', () => {
    expect(formatPrice(99000)).toBe(idr(99000));
    expect(formatPrice('50000')).toBe(idr(50000));
  });

  it('treats null/undefined as 0', () => {
    expect(formatPrice(null)).toBe(idr(0));
    expect(formatPrice(undefined)).toBe(idr(0));
  });
});

describe('getProductPrimaryImage', () => {
  it('returns null when medias empty', () => {
    expect(getProductPrimaryImage({ ...base, medias: [] })).toBeNull();
  });

  it('prefers first media with type=1 (image)', () => {
    const p = {
      ...base,
      medias: [
        { id: 1, type: 2, url: 'http://video.mp4' },
        { id: 2, type: 1, url: 'http://img.jpg' },
        { id: 3, type: 1, url: 'http://img2.jpg' },
      ],
    } as unknown as ProductListItem;
    expect(getProductPrimaryImage(p)).toBe('http://img.jpg');
  });

  it('falls back to first media when no type=1', () => {
    const p = {
      ...base,
      medias: [
        { id: 1, type: 2, url: 'http://first.jpg' },
        { id: 2, type: 3, url: 'http://second.jpg' },
      ],
    } as unknown as ProductListItem;
    expect(getProductPrimaryImage(p)).toBe('http://first.jpg');
  });

  it('returns null when medias is undefined', () => {
    const p = { ...base } as ProductListItem;
    // @ts-expect-error simulating missing field
    p.medias = undefined;
    expect(getProductPrimaryImage(p)).toBeNull();
  });
});

describe('getProductTotalStock', () => {
  it('returns 0 when no variants', () => {
    expect(getProductTotalStock({ ...base, variants: [] })).toBe(0);
  });

  it('sums variant stocks', () => {
    const p = {
      ...base,
      variants: [{ stock: 5 }, { stock: 10 }, { stock: 3 }],
    } as unknown as ProductListItem;
    expect(getProductTotalStock(p)).toBe(18);
  });

  it('coerces numeric strings', () => {
    const p = {
      ...base,
      variants: [{ stock: '7' }, { stock: '8' }],
    } as unknown as ProductListItem;
    expect(getProductTotalStock(p)).toBe(15);
  });

  it('treats non-numeric stock as 0', () => {
    const p = {
      ...base,
      variants: [{ stock: 'abc' }, { stock: 5 }],
    } as unknown as ProductListItem;
    expect(getProductTotalStock(p)).toBe(5);
  });
});

describe('hasSeoFilled', () => {
  it('returns true only when all three meta fields are non-empty', () => {
    const p = {
      ...base,
      metaTitle: 'T',
      metaDescription: 'D',
      metaKeywords: 'K',
    } as unknown as ProductListItem;
    expect(hasSeoFilled(p)).toBe(true);
  });

  it('returns false when any field is missing', () => {
    const p1 = { ...base, metaTitle: 'T', metaDescription: 'D' } as ProductListItem;
    const p2 = { ...base, metaTitle: 'T', metaKeywords: 'K' } as ProductListItem;
    expect(hasSeoFilled(p1)).toBe(false);
    expect(hasSeoFilled(p2)).toBe(false);
  });

  it('returns false when any field is whitespace-only', () => {
    const p = {
      ...base,
      metaTitle: '   ',
      metaDescription: 'D',
      metaKeywords: 'K',
    } as unknown as ProductListItem;
    expect(hasSeoFilled(p)).toBe(false);
  });

  it('returns false when all null', () => {
    expect(hasSeoFilled(base)).toBe(false);
  });
});
