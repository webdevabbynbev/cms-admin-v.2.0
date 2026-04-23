import { describe, it, expect } from 'vitest';
import { normalizeBrand } from './normalize';

describe('normalizeBrand', () => {
  it('returns defaults for empty input', () => {
    expect(normalizeBrand({})).toEqual({
      id: 0,
      name: '',
      slug: '',
      description: null,
      logoUrl: null,
      bannerUrl: null,
      country: null,
      website: null,
      isActive: true,
      createdAt: null,
      updatedAt: null,
    });
  });

  it('handles null/undefined raw input', () => {
    expect(normalizeBrand(null).id).toBe(0);
    expect(normalizeBrand(undefined).id).toBe(0);
  });

  it('reads camelCase fields', () => {
    const result = normalizeBrand({
      id: 1,
      name: 'Abby',
      slug: 'abby',
      description: 'desc',
      logoUrl: 'http://cdn/logo.png',
      bannerUrl: 'http://cdn/banner.png',
      country: 'ID',
      website: 'https://abby.com',
      isActive: false,
    });
    expect(result.logoUrl).toBe('http://cdn/logo.png');
    expect(result.bannerUrl).toBe('http://cdn/banner.png');
    expect(result.isActive).toBe(false);
  });

  it('reads snake_case fallbacks', () => {
    const result = normalizeBrand({
      logo_url: 'http://cdn/sc.png',
      banner_url: 'http://cdn/sb.png',
      is_active: false,
      created_at: '2026-01-01',
      updated_at: '2026-02-01',
    });
    expect(result.logoUrl).toBe('http://cdn/sc.png');
    expect(result.bannerUrl).toBe('http://cdn/sb.png');
    expect(result.isActive).toBe(false);
    expect(result.createdAt).toBe('2026-01-01');
    expect(result.updatedAt).toBe('2026-02-01');
  });

  it('isActive defaults to true when absent', () => {
    expect(normalizeBrand({}).isActive).toBe(true);
  });
});
