import { describe, it, expect } from 'vitest';
import { normalizeFaq } from './normalize';

describe('normalizeFaq', () => {
  it('returns defaults for empty input', () => {
    expect(normalizeFaq({})).toEqual({
      id: 0,
      question: '',
      answer: '',
      createdAt: null,
      updatedAt: null,
    });
  });

  it('handles null/undefined raw input', () => {
    expect(normalizeFaq(null).id).toBe(0);
    expect(normalizeFaq(undefined).id).toBe(0);
  });

  it('reads all fields with snake_case timestamps', () => {
    const result = normalizeFaq({
      id: 5,
      question: 'How to order?',
      answer: 'Click the button.',
      created_at: '2026-01-01',
      updated_at: '2026-02-01',
    });
    expect(result).toEqual({
      id: 5,
      question: 'How to order?',
      answer: 'Click the button.',
      createdAt: '2026-01-01',
      updatedAt: '2026-02-01',
    });
  });
});
