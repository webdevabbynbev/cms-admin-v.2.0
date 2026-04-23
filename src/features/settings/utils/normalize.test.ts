import { describe, it, expect } from 'vitest';
import { normalizeSetting } from './normalize';

describe('normalizeSetting', () => {
  it('returns defaults for empty input', () => {
    expect(normalizeSetting({})).toEqual({
      id: 0,
      key: '',
      group: '',
      value: '',
      createdAt: null,
      updatedAt: null,
    });
  });

  it('handles null/undefined raw input', () => {
    expect(normalizeSetting(null).id).toBe(0);
    expect(normalizeSetting(undefined).id).toBe(0);
  });

  it('reads all fields with snake_case timestamp fallback', () => {
    const result = normalizeSetting({
      id: 5,
      key: 'site_name',
      group: 'general',
      value: 'Abby n Bev',
      created_at: '2026-01-01',
      updated_at: '2026-02-01',
    });
    expect(result).toEqual({
      id: 5,
      key: 'site_name',
      group: 'general',
      value: 'Abby n Bev',
      createdAt: '2026-01-01',
      updatedAt: '2026-02-01',
    });
  });

  it('coerces value field to string (even when number)', () => {
    expect(normalizeSetting({ value: 42 }).value).toBe('42');
  });
});
