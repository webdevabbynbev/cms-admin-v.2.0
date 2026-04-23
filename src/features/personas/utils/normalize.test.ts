import { describe, it, expect } from 'vitest';
import { normalizePersona } from './normalize';

describe('normalizePersona', () => {
  it('returns defaults for empty input', () => {
    expect(normalizePersona({})).toEqual({
      id: 0,
      name: '',
      slug: '',
      description: null,
      createdAt: null,
      updatedAt: null,
    });
  });

  it('handles null/undefined raw input', () => {
    expect(normalizePersona(null).id).toBe(0);
    expect(normalizePersona(undefined).id).toBe(0);
  });

  it('reads all fields with snake_case timestamps', () => {
    const result = normalizePersona({
      id: 7,
      name: 'Morning Routine',
      slug: 'morning-routine',
      description: 'A routine for mornings',
      created_at: '2026-01-01',
      updated_at: '2026-02-01',
    });
    expect(result).toEqual({
      id: 7,
      name: 'Morning Routine',
      slug: 'morning-routine',
      description: 'A routine for mornings',
      createdAt: '2026-01-01',
      updatedAt: '2026-02-01',
    });
  });

  it('description null when absent', () => {
    expect(normalizePersona({ id: 1 }).description).toBeNull();
  });
});
