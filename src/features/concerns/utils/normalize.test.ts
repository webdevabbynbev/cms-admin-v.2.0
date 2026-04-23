import { describe, it, expect } from 'vitest';
import { normalizeConcern, normalizeConcernOption } from './normalize';

describe('normalizeConcern', () => {
  it('returns defaults for empty input', () => {
    expect(normalizeConcern({})).toEqual({
      id: 0,
      name: '',
      slug: '',
      description: null,
      position: 0,
      createdAt: null,
      updatedAt: null,
    });
  });

  it('handles null/undefined raw input', () => {
    expect(normalizeConcern(null).id).toBe(0);
    expect(normalizeConcern(undefined).id).toBe(0);
  });

  it('reads camelCase fields', () => {
    const result = normalizeConcern({
      id: 3,
      name: 'Acne',
      slug: 'acne',
      description: 'Pimple-related concern',
      position: 2,
      createdAt: '2026-03-01',
      updatedAt: '2026-03-02',
    });
    expect(result).toEqual({
      id: 3,
      name: 'Acne',
      slug: 'acne',
      description: 'Pimple-related concern',
      position: 2,
      createdAt: '2026-03-01',
      updatedAt: '2026-03-02',
    });
  });

  it('reads snake_case timestamps', () => {
    const result = normalizeConcern({
      id: 3,
      created_at: '2026-03-01',
      updated_at: '2026-03-02',
    });
    expect(result.createdAt).toBe('2026-03-01');
    expect(result.updatedAt).toBe('2026-03-02');
  });

  it('description stays null when not provided', () => {
    expect(normalizeConcern({ id: 1 }).description).toBeNull();
  });

  it('position coerces from numeric string and defaults to 0', () => {
    expect(normalizeConcern({ position: '5' }).position).toBe(5);
    expect(normalizeConcern({}).position).toBe(0);
  });
});

describe('normalizeConcernOption', () => {
  it('returns defaults for empty input', () => {
    expect(normalizeConcernOption({})).toEqual({
      id: 0,
      concernId: 0,
      name: '',
      slug: '',
      description: null,
      position: 0,
      concern: null,
      createdAt: null,
      updatedAt: null,
    });
  });

  it('reads camelCase concernId', () => {
    expect(normalizeConcernOption({ concernId: 7 }).concernId).toBe(7);
  });

  it('reads snake_case concern_id fallback', () => {
    expect(normalizeConcernOption({ concern_id: 9 }).concernId).toBe(9);
  });

  it('extracts nested concern with id+name+slug', () => {
    const result = normalizeConcernOption({
      id: 1,
      concern: { id: 10, name: 'Acne', slug: 'acne' },
    });
    expect(result.concern).toEqual({ id: 10, name: 'Acne', slug: 'acne' });
  });

  it('nested concern defaults when sub-fields missing', () => {
    expect(normalizeConcernOption({ concern: {} }).concern).toEqual({
      id: 0,
      name: '',
      slug: '',
    });
  });

  it('concern null when not provided', () => {
    expect(normalizeConcernOption({ id: 1 }).concern).toBeNull();
  });
});
