import { describe, it, expect } from 'vitest';
import { detectCategoryFlags } from './category-detection';
import type { CategoryType } from '../types';

const categories: CategoryType[] = [
  {
    id: 1,
    name: 'Makeup',
    children: [
      { id: 10, name: 'Lipstick' },
      { id: 11, name: 'Mascara', children: [{ id: 20, name: 'Liquid' }] },
    ],
  },
  {
    id: 2,
    name: 'Perfume',
    children: [{ id: 30, name: 'Eau de Parfum' }],
  },
  {
    id: 3,
    name: 'Skincare',
    children: [
      { id: 40, name: 'Moisturizer' },
      { id: 41, name: 'Fragrance-free Cleanser' },
    ],
  },
  {
    id: 4,
    name: 'Hair Care',
    children: [{ id: 50, name: 'Shampoo' }],
  },
] as CategoryType[];

describe('detectCategoryFlags', () => {
  it('returns all false for empty selection', () => {
    expect(detectCategoryFlags([], categories)).toEqual({
      isMakeup: false,
      isPerfume: false,
      isSkincare: false,
    });
  });

  it('detects makeup from top-level category id', () => {
    expect(detectCategoryFlags([1], categories)).toMatchObject({
      isMakeup: true,
      isPerfume: false,
      isSkincare: false,
    });
  });

  it('detects makeup from nested child id (inherits via path)', () => {
    expect(detectCategoryFlags([10], categories).isMakeup).toBe(true);
    expect(detectCategoryFlags([20], categories).isMakeup).toBe(true);
  });

  it('detects perfume', () => {
    expect(detectCategoryFlags([2], categories).isPerfume).toBe(true);
    expect(detectCategoryFlags([30], categories).isPerfume).toBe(true);
  });

  it('detects fragrance keyword as perfume', () => {
    // Skincare > Fragrance-free Cleanser contains "fragrance"
    expect(detectCategoryFlags([41], categories).isPerfume).toBe(true);
  });

  it('detects skincare', () => {
    expect(detectCategoryFlags([3], categories).isSkincare).toBe(true);
    expect(detectCategoryFlags([40], categories).isSkincare).toBe(true);
  });

  it('supports multiple flags at once', () => {
    expect(detectCategoryFlags([10, 30, 40], categories)).toEqual({
      isMakeup: true,
      isPerfume: true,
      isSkincare: true,
    });
  });

  it('returns all false for non-matching category (e.g. Hair Care)', () => {
    expect(detectCategoryFlags([4], categories)).toEqual({
      isMakeup: false,
      isPerfume: false,
      isSkincare: false,
    });
  });

  it('ignores unknown ids', () => {
    expect(detectCategoryFlags([9999, 888], categories)).toEqual({
      isMakeup: false,
      isPerfume: false,
      isSkincare: false,
    });
  });

  it('returns all false for empty category list', () => {
    expect(detectCategoryFlags([1, 2, 3], [])).toEqual({
      isMakeup: false,
      isPerfume: false,
      isSkincare: false,
    });
  });
});
