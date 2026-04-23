import { describe, it, expect } from 'vitest';
import {
  normalizeParticipant,
  normalizeRecommendation,
  normalizeRecommendationBanner,
  normalizeSpinPrize,
} from './normalize';

describe('normalizeSpinPrize', () => {
  it('returns defaults for empty input', () => {
    expect(normalizeSpinPrize({})).toEqual({
      id: 0,
      name: '',
      weight: 0,
      isGrand: false,
      isActive: true,
      dailyQuota: null,
      voucherId: null,
      voucherQty: 1,
      createdAt: null,
      updatedAt: null,
    });
  });

  it('reads camelCase + snake_case', () => {
    expect(
      normalizeSpinPrize({
        id: 1,
        name: 'Jackpot',
        weight: 10,
        is_grand: true,
        is_active: false,
        daily_quota: 5,
        voucher_id: 100,
        voucher_qty: 3,
      }),
    ).toMatchObject({
      id: 1,
      name: 'Jackpot',
      isGrand: true,
      isActive: false,
      dailyQuota: 5,
      voucherId: 100,
      voucherQty: 3,
    });
  });

  it('defaults voucherQty to 1 when field absent', () => {
    expect(normalizeSpinPrize({ id: 1 }).voucherQty).toBe(1);
  });

  it('maps empty dailyQuota/voucherId to null', () => {
    expect(normalizeSpinPrize({ dailyQuota: '' }).dailyQuota).toBeNull();
    expect(normalizeSpinPrize({ voucher_id: null }).voucherId).toBeNull();
  });
});

describe('normalizeRecommendation', () => {
  it('defaults for empty', () => {
    expect(normalizeRecommendation({})).toMatchObject({
      id: 0,
      productId: null,
      productName: '',
      position: 0,
      isActive: true,
    });
  });

  it('reads snake_case product_id/product_name', () => {
    expect(
      normalizeRecommendation({ product_id: 42, product_name: 'Kurma' }),
    ).toMatchObject({ productId: 42, productName: 'Kurma' });
  });
});

describe('normalizeRecommendationBanner', () => {
  it('defaults imageType to "upload"', () => {
    expect(normalizeRecommendationBanner({}).imageType).toBe('upload');
    expect(normalizeRecommendationBanner({}).imageMobileType).toBe('upload');
  });

  it('reads both image variants from snake_case', () => {
    const result = normalizeRecommendationBanner({
      image_url: 'http://x/a.png',
      image_type: 'external',
      image_mobile_url: 'http://x/b.png',
      image_mobile_type: 'external',
    });
    expect(result).toMatchObject({
      imageUrl: 'http://x/a.png',
      imageType: 'external',
      imageMobileUrl: 'http://x/b.png',
      imageMobileType: 'external',
    });
  });

  it('reads bannerDate from snake_case banner_date', () => {
    expect(
      normalizeRecommendationBanner({ banner_date: '2026-04-22' }).bannerDate,
    ).toBe('2026-04-22');
  });
});

describe('normalizeParticipant', () => {
  it('reads all prize fields (prize7/15/30)', () => {
    const result = normalizeParticipant({
      id: 1,
      name: 'A',
      email: 'a@b.com',
      prize_7: 'Voucher A',
      prize_15: 'Voucher B',
      prize_30: 'Grand Prize',
    });
    expect(result.prize7).toBe('Voucher A');
    expect(result.prize15).toBe('Voucher B');
    expect(result.prize30).toBe('Grand Prize');
  });

  it('prefers camelCase prize keys over snake_case', () => {
    const result = normalizeParticipant({
      prize7: 'CAMEL',
      prize_7: 'snake',
    });
    expect(result.prize7).toBe('CAMEL');
  });

  it('returns null for missing prize fields', () => {
    expect(normalizeParticipant({ id: 1 }).prize7).toBeNull();
    expect(normalizeParticipant({ id: 1 }).prize15).toBeNull();
    expect(normalizeParticipant({ id: 1 }).prize30).toBeNull();
  });

  it('reads totalFasting/totalNotFasting counters', () => {
    const result = normalizeParticipant({
      total_fasting: 25,
      total_not_fasting: 5,
      not_fasting_reasons: 'sakit',
    });
    expect(result.totalFasting).toBe(25);
    expect(result.totalNotFasting).toBe(5);
    expect(result.notFastingReasons).toBe('sakit');
  });
});
