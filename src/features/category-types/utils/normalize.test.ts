import { describe, it, expect } from 'vitest';
import { normalizeCategoryType } from './normalize';

describe('normalizeCategoryType', () => {
  it('returns defaults for empty input', () => {
    expect(normalizeCategoryType({})).toEqual({
      id: 0,
      name: '',
      slug: '',
      parentId: null,
      level: 0,
      iconPublicId: null,
      iconUrl: null,
      productsCount: 0,
      createdAt: null,
      updatedAt: null,
    });
  });

  it('handles null/undefined raw input', () => {
    expect(normalizeCategoryType(null).id).toBe(0);
    expect(normalizeCategoryType(undefined).id).toBe(0);
  });

  it('reads camelCase fields', () => {
    const result = normalizeCategoryType({
      id: 5,
      name: 'Skincare',
      slug: 'skincare',
      parentId: 1,
      level: 2,
      iconPublicId: 'ic_12345',
      iconUrl: 'http://cdn/ic.png',
      productsCount: 30,
      createdAt: '2026-01-01',
      updatedAt: '2026-02-01',
    });
    expect(result).toEqual({
      id: 5,
      name: 'Skincare',
      slug: 'skincare',
      parentId: 1,
      level: 2,
      iconPublicId: 'ic_12345',
      iconUrl: 'http://cdn/ic.png',
      productsCount: 30,
      createdAt: '2026-01-01',
      updatedAt: '2026-02-01',
    });
  });

  it('reads snake_case fallbacks', () => {
    const result = normalizeCategoryType({
      parent_id: 7,
      icon_public_id: 'ic_snake',
      icon_url: 'http://cdn/sc.png',
      products_count: 15,
      created_at: '2026-03-01',
      updated_at: '2026-03-02',
    });
    expect(result.parentId).toBe(7);
    expect(result.iconPublicId).toBe('ic_snake');
    expect(result.iconUrl).toBe('http://cdn/sc.png');
    expect(result.productsCount).toBe(15);
    expect(result.createdAt).toBe('2026-03-01');
    expect(result.updatedAt).toBe('2026-03-02');
  });

  it('parentId null when empty string', () => {
    expect(normalizeCategoryType({ parentId: '' }).parentId).toBeNull();
  });

  it('parentId coerces numeric string', () => {
    expect(normalizeCategoryType({ parentId: '3' }).parentId).toBe(3);
  });

  it('parentId null for non-numeric', () => {
    expect(normalizeCategoryType({ parentId: 'abc' }).parentId).toBeNull();
  });

  it('level defaults to 0 when absent', () => {
    expect(normalizeCategoryType({}).level).toBe(0);
  });

  it('level coerces numeric string', () => {
    expect(normalizeCategoryType({ level: '2' }).level).toBe(2);
  });

  it('productsCount defaults to 0 when absent', () => {
    expect(normalizeCategoryType({}).productsCount).toBe(0);
  });
});
