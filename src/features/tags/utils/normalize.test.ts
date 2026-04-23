import { describe, it, expect } from 'vitest';
import { normalizeTag } from './normalize';

describe('normalizeTag', () => {
  it('returns defaults for empty input', () => {
    expect(normalizeTag({})).toEqual({
      id: 0,
      name: '',
      slug: '',
      description: null,
      createdAt: null,
      updatedAt: null,
    });
  });

  it('handles null/undefined raw input', () => {
    expect(normalizeTag(null).id).toBe(0);
    expect(normalizeTag(undefined).id).toBe(0);
  });

  it('reads all fields including snake_case timestamps', () => {
    const result = normalizeTag({
      id: 1,
      name: 'New',
      slug: 'new',
      description: 'tag desc',
      created_at: '2026-01-01',
      updated_at: '2026-01-02',
    });
    expect(result).toEqual({
      id: 1,
      name: 'New',
      slug: 'new',
      description: 'tag desc',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-02',
    });
  });

  it('coerces numeric id from string', () => {
    expect(normalizeTag({ id: '42' }).id).toBe(42);
  });
});
