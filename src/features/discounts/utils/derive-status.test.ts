import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { deriveDiscountStatus } from './derive-status';
import { DiscountActiveFlag, DiscountStatus } from '../types';

describe('deriveDiscountStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Fix clock to 2026-04-15 12:00 WIB (05:00 UTC)
    vi.setSystemTime(new Date('2026-04-15T05:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns Inactive when isActive flag is 0', () => {
    expect(
      deriveDiscountStatus({
        isActive: DiscountActiveFlag.Inactive,
        startedAt: '2026-04-01T00:00:00+07:00',
        expiredAt: '2026-04-30T23:59:59+07:00',
      }),
    ).toBe(DiscountStatus.Inactive);
  });

  it('returns Active when within [startedAt, expiredAt]', () => {
    expect(
      deriveDiscountStatus({
        isActive: DiscountActiveFlag.Active,
        startedAt: '2026-04-01T00:00:00+07:00',
        expiredAt: '2026-04-30T23:59:59+07:00',
      }),
    ).toBe(DiscountStatus.Active);
  });

  it('returns Upcoming when now is before startedAt', () => {
    expect(
      deriveDiscountStatus({
        isActive: DiscountActiveFlag.Active,
        startedAt: '2026-05-01T00:00:00+07:00',
        expiredAt: '2026-05-31T23:59:59+07:00',
      }),
    ).toBe(DiscountStatus.Upcoming);
  });

  it('returns Expired when now is after expiredAt', () => {
    expect(
      deriveDiscountStatus({
        isActive: DiscountActiveFlag.Active,
        startedAt: '2026-03-01T00:00:00+07:00',
        expiredAt: '2026-03-31T23:59:59+07:00',
      }),
    ).toBe(DiscountStatus.Expired);
  });

  it('returns Active when both dates are null', () => {
    expect(
      deriveDiscountStatus({
        isActive: DiscountActiveFlag.Active,
        startedAt: null,
        expiredAt: null,
      }),
    ).toBe(DiscountStatus.Active);
  });

  it('returns Active when only startedAt is null and endedAt is in future', () => {
    expect(
      deriveDiscountStatus({
        isActive: DiscountActiveFlag.Active,
        startedAt: null,
        expiredAt: '2026-12-31T23:59:59+07:00',
      }),
    ).toBe(DiscountStatus.Active);
  });

  it('returns Expired when only expiredAt in past, startedAt null', () => {
    expect(
      deriveDiscountStatus({
        isActive: DiscountActiveFlag.Active,
        startedAt: null,
        expiredAt: '2026-01-31T23:59:59+07:00',
      }),
    ).toBe(DiscountStatus.Expired);
  });

  it('Inactive flag wins over date range being valid', () => {
    expect(
      deriveDiscountStatus({
        isActive: DiscountActiveFlag.Inactive,
        startedAt: null,
        expiredAt: null,
      }),
    ).toBe(DiscountStatus.Inactive);
  });
});
