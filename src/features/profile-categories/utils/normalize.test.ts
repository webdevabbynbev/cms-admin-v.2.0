import { describe, it, expect } from 'vitest';
import {
  normalizeProfileCategory,
  normalizeProfileCategoryOption,
} from './normalize';

describe('normalizeProfileCategory', () => {
  it('returns defaults for empty input', () => {
    expect(normalizeProfileCategory({})).toEqual({
      id: 0,
      name: '',
      type: null,
      createdAt: null,
      updatedAt: null,
    });
  });

  it('handles null/undefined raw input', () => {
    expect(normalizeProfileCategory(null).id).toBe(0);
    expect(normalizeProfileCategory(undefined).id).toBe(0);
  });

  it('reads camelCase + snake_case timestamps', () => {
    expect(
      normalizeProfileCategory({
        id: 5,
        name: 'Hair',
        type: 'static',
        createdAt: '2026-01-01',
      }).createdAt,
    ).toBe('2026-01-01');
    expect(
      normalizeProfileCategory({
        id: 5,
        name: 'Hair',
        created_at: '2026-02-02',
        updated_at: '2026-02-03',
      }),
    ).toEqual({
      id: 5,
      name: 'Hair',
      type: null,
      createdAt: '2026-02-02',
      updatedAt: '2026-02-03',
    });
  });

  it('coerces numeric id from string', () => {
    expect(normalizeProfileCategory({ id: '12' }).id).toBe(12);
  });
});

describe('normalizeProfileCategoryOption', () => {
  it('returns defaults for empty input', () => {
    expect(normalizeProfileCategoryOption({})).toEqual({
      id: 0,
      profileCategoriesId: 0,
      label: '',
      value: '',
      isActive: true,
      category: null,
      createdAt: null,
      updatedAt: null,
    });
  });

  it('reads camelCase fields', () => {
    const result = normalizeProfileCategoryOption({
      id: 10,
      profileCategoriesId: 3,
      label: 'Dry',
      value: 'dry',
      isActive: false,
    });
    expect(result).toEqual({
      id: 10,
      profileCategoriesId: 3,
      label: 'Dry',
      value: 'dry',
      isActive: false,
      category: null,
      createdAt: null,
      updatedAt: null,
    });
  });

  it('reads snake_case profile_categories_id fallback', () => {
    const result = normalizeProfileCategoryOption({
      id: 11,
      profile_categories_id: 7,
      label: 'Oily',
      value: 'oily',
      is_active: true,
    });
    expect(result.profileCategoriesId).toBe(7);
    expect(result.isActive).toBe(true);
  });

  it('defaults isActive to true when absent', () => {
    expect(normalizeProfileCategoryOption({}).isActive).toBe(true);
  });

  it('extracts nested category object when present', () => {
    const result = normalizeProfileCategoryOption({
      id: 1,
      category: { id: 99, name: 'Skin Type' },
    });
    expect(result.category).toEqual({ id: 99, name: 'Skin Type' });
  });

  it('nested category defaults id=0 and name="" when fields missing', () => {
    const result = normalizeProfileCategoryOption({
      id: 1,
      category: {},
    });
    expect(result.category).toEqual({ id: 0, name: '' });
  });

  it('category is null when not provided', () => {
    expect(normalizeProfileCategoryOption({ id: 1 }).category).toBeNull();
  });
});
