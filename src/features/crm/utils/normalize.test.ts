import { describe, it, expect } from 'vitest';
import { normalizeMember, normalizeAffiliate } from './normalize';

describe('normalizeMember', () => {
  it('returns defaults for empty object', () => {
    const result = normalizeMember({});
    expect(result).toEqual({
      id: 0,
      name: '',
      email: '',
      phoneNumber: null,
      photoProfileUrl: null,
      isActive: true,
      emailVerified: null,
      crmTier: 'Customer',
      referralCode: null,
      totalOrders: 0,
      ltv: 0,
      section: null,
      profileCompletion: 0,
      createdAt: null,
    });
  });

  it('handles null/undefined raw input', () => {
    expect(normalizeMember(null).id).toBe(0);
    expect(normalizeMember(undefined).id).toBe(0);
  });

  it('reads camelCase fields', () => {
    const result = normalizeMember({
      id: 5,
      name: 'Abby',
      email: 'a@b.com',
      phoneNumber: '0812',
      photoProfileUrl: 'http://x/p.jpg',
      isActive: false,
      emailVerified: '2026-01-01',
      crmTier: 'Gold',
      referralCode: 'ABBY01',
      totalOrders: 7,
      ltv: 1500000,
      section: 'vip',
      createdAt: '2026-01-01',
    });
    expect(result.id).toBe(5);
    expect(result.name).toBe('Abby');
    expect(result.phoneNumber).toBe('0812');
    expect(result.photoProfileUrl).toBe('http://x/p.jpg');
    expect(result.isActive).toBe(false);
    expect(result.emailVerified).toBe('2026-01-01');
    expect(result.crmTier).toBe('Gold');
    expect(result.referralCode).toBe('ABBY01');
    expect(result.totalOrders).toBe(7);
    expect(result.ltv).toBe(1500000);
    expect(result.section).toBe('vip');
  });

  it('reads snake_case fallbacks', () => {
    const result = normalizeMember({
      phone_number: '0821',
      photo_profile_url: 'http://x/y.jpg',
      is_active: false,
      email_verified: '2026-02-02',
      crm_tier: 'Silver',
      referral_code: 'REF1',
      total_orders: 3,
      ltv: 500000,
      created_at: '2026-01-15',
    });
    expect(result.phoneNumber).toBe('0821');
    expect(result.photoProfileUrl).toBe('http://x/y.jpg');
    expect(result.isActive).toBe(false);
    expect(result.emailVerified).toBe('2026-02-02');
    expect(result.crmTier).toBe('Silver');
    expect(result.referralCode).toBe('REF1');
    expect(result.totalOrders).toBe(3);
    expect(result.ltv).toBe(500000);
    expect(result.createdAt).toBe('2026-01-15');
  });

  it('defaults isActive to true when field is absent', () => {
    expect(normalizeMember({}).isActive).toBe(true);
  });

  it('defaults crmTier to "Customer" when missing', () => {
    expect(normalizeMember({}).crmTier).toBe('Customer');
  });

  it('coerces numeric strings', () => {
    const result = normalizeMember({
      id: '77',
      totalOrders: '5',
      ltv: '999000',
    });
    expect(result.id).toBe(77);
    expect(result.totalOrders).toBe(5);
    expect(result.ltv).toBe(999000);
  });

  it('falls back to 0 for non-numeric values', () => {
    const result = normalizeMember({
      ltv: 'abc',
      totalOrders: null,
    });
    expect(result.ltv).toBe(0);
    expect(result.totalOrders).toBe(0);
  });

  it('reads profileCompletion from backend-typo keys', () => {
    expect(normalizeMember({ profilCompletion: 50 }).profileCompletion).toBe(50);
    expect(normalizeMember({ profile_completion: 70 }).profileCompletion).toBe(70);
    expect(normalizeMember({ profil_completion: 60 }).profileCompletion).toBe(60);
  });

  it('does NOT read correctly-spelled profileCompletion (backend never sends it)', () => {
    expect(normalizeMember({ profileCompletion: 80 }).profileCompletion).toBe(0);
  });

  it('prefers profilCompletion (backend typo) over other keys when all present', () => {
    const result = normalizeMember({
      profilCompletion: 10,
      profile_completion: 20,
      profil_completion: 30,
    });
    expect(result.profileCompletion).toBe(10);
  });
});

describe('normalizeAffiliate', () => {
  it('returns defaults for empty object', () => {
    const result = normalizeAffiliate({});
    expect(result).toEqual({
      id: 0,
      code: '',
      discountPercent: 0,
      isActive: true,
      expiredAt: null,
      totalRedemptions: 0,
      totalDiscountGiven: 0,
      komisiEarned: 0,
      createdAt: null,
    });
  });

  it('handles null/undefined raw input', () => {
    expect(normalizeAffiliate(null).id).toBe(0);
    expect(normalizeAffiliate(undefined).id).toBe(0);
  });

  it('reads camelCase fields', () => {
    const result = normalizeAffiliate({
      id: 11,
      code: 'AFF10',
      discountPercent: 10,
      isActive: false,
      expiredAt: '2026-12-31',
      totalRedemptions: 25,
      totalDiscountGiven: 1250000,
      komisiEarned: 500000,
      createdAt: '2026-01-05',
    });
    expect(result).toEqual({
      id: 11,
      code: 'AFF10',
      discountPercent: 10,
      isActive: false,
      expiredAt: '2026-12-31',
      totalRedemptions: 25,
      totalDiscountGiven: 1250000,
      komisiEarned: 500000,
      createdAt: '2026-01-05',
    });
  });

  it('reads snake_case fallbacks', () => {
    const result = normalizeAffiliate({
      discount_percent: 15,
      is_active: false,
      expired_at: '2027-01-01',
      total_redemptions: 50,
      total_discount_given: 2500000,
      komisi_earned: 750000,
      created_at: '2026-02-01',
    });
    expect(result.discountPercent).toBe(15);
    expect(result.isActive).toBe(false);
    expect(result.expiredAt).toBe('2027-01-01');
    expect(result.totalRedemptions).toBe(50);
    expect(result.totalDiscountGiven).toBe(2500000);
    expect(result.komisiEarned).toBe(750000);
    expect(result.createdAt).toBe('2026-02-01');
  });

  it('defaults isActive to true when absent', () => {
    expect(normalizeAffiliate({}).isActive).toBe(true);
  });

  it('coerces numeric strings', () => {
    const result = normalizeAffiliate({
      discountPercent: '20',
      totalRedemptions: '5',
      komisiEarned: '100000',
    });
    expect(result.discountPercent).toBe(20);
    expect(result.totalRedemptions).toBe(5);
    expect(result.komisiEarned).toBe(100000);
  });

  it('falls back to 0 for non-numeric values', () => {
    const result = normalizeAffiliate({
      discountPercent: 'bad',
      komisiEarned: undefined,
    });
    expect(result.discountPercent).toBe(0);
    expect(result.komisiEarned).toBe(0);
  });
});
