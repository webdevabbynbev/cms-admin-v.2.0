import { describe, it, expect } from 'vitest';
import { normalizeSection } from './normalize';

describe('normalizeSection', () => {
  it('returns defaults for empty input', () => {
    expect(normalizeSection({})).toEqual({
      id: 0,
      name: '',
      slug: '',
      order: 0,
      createdAt: null,
      updatedAt: null,
    });
  });

  it('handles null/undefined raw input', () => {
    expect(normalizeSection(null).id).toBe(0);
    expect(normalizeSection(undefined).id).toBe(0);
  });

  it('reads all fields with snake_case timestamps', () => {
    const result = normalizeSection({
      id: 3,
      name: 'Hero',
      slug: 'hero',
      order: 1,
      created_at: '2026-01-01',
      updated_at: '2026-02-01',
    });
    expect(result).toEqual({
      id: 3,
      name: 'Hero',
      slug: 'hero',
      order: 1,
      createdAt: '2026-01-01',
      updatedAt: '2026-02-01',
    });
  });

  it('order coerces numeric string, defaults 0', () => {
    expect(normalizeSection({ order: '5' }).order).toBe(5);
    expect(normalizeSection({}).order).toBe(0);
  });
});
