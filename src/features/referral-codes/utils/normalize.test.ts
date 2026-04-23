import { describe, it, expect } from 'vitest';
import { normalizeReferralCode } from './normalize';

describe('normalizeReferralCode', () => {
  it('returns defaults for empty input', () => {
    expect(normalizeReferralCode({})).toEqual({
      id: 0,
      code: '',
      discountPercent: 0,
      maxUsesTotal: 0,
      usedCount: 0,
      isActive: true,
      startedAt: null,
      expiredAt: null,
      createdAt: null,
      updatedAt: null,
    });
  });

  it('handles null/undefined raw input', () => {
    expect(normalizeReferralCode(null).id).toBe(0);
    expect(normalizeReferralCode(undefined).id).toBe(0);
  });

  it('reads camelCase fields', () => {
    const result = normalizeReferralCode({
      id: 10,
      code: 'REF2026',
      discountPercent: 15,
      maxUsesTotal: 100,
      usedCount: 25,
      isActive: false,
      startedAt: '2026-04-01',
      expiredAt: '2026-12-31',
      createdAt: '2026-01-01',
      updatedAt: '2026-02-01',
    });
    expect(result).toEqual({
      id: 10,
      code: 'REF2026',
      discountPercent: 15,
      maxUsesTotal: 100,
      usedCount: 25,
      isActive: false,
      startedAt: '2026-04-01',
      expiredAt: '2026-12-31',
      createdAt: '2026-01-01',
      updatedAt: '2026-02-01',
    });
  });

  it('reads snake_case fallbacks', () => {
    const result = normalizeReferralCode({
      discount_percent: 20,
      max_uses_total: 50,
      used_count: 10,
      is_active: false,
      started_at: '2026-05-01',
      expired_at: '2026-06-01',
      created_at: '2026-03-01',
      updated_at: '2026-03-02',
    });
    expect(result.discountPercent).toBe(20);
    expect(result.maxUsesTotal).toBe(50);
    expect(result.usedCount).toBe(10);
    expect(result.isActive).toBe(false);
    expect(result.startedAt).toBe('2026-05-01');
    expect(result.expiredAt).toBe('2026-06-01');
    expect(result.createdAt).toBe('2026-03-01');
    expect(result.updatedAt).toBe('2026-03-02');
  });

  it('isActive defaults to true when absent', () => {
    expect(normalizeReferralCode({}).isActive).toBe(true);
  });

  it('coerces numeric strings on counters', () => {
    const result = normalizeReferralCode({
      discountPercent: '10',
      maxUsesTotal: '200',
      usedCount: '33',
    });
    expect(result.discountPercent).toBe(10);
    expect(result.maxUsesTotal).toBe(200);
    expect(result.usedCount).toBe(33);
  });

  it('counters fall back to 0 for non-numeric', () => {
    const result = normalizeReferralCode({
      discountPercent: 'bad',
      maxUsesTotal: null,
      usedCount: undefined,
    });
    expect(result.discountPercent).toBe(0);
    expect(result.maxUsesTotal).toBe(0);
    expect(result.usedCount).toBe(0);
  });
});
