import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { deriveVoucherStatus } from './derive-status';
import { VoucherActiveStatus } from '../types';

describe('deriveVoucherStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // 2026-04-15 12:00 WIB
    vi.setSystemTime(new Date('2026-04-15T05:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const base = {
    isActive: VoucherActiveStatus.Active,
    startedAt: '2026-04-01T00:00:00+07:00',
    expiredAt: '2026-04-30T23:59:59+07:00',
    qty: 0,
    usedCount: 0,
  };

  it('returns inactive when isActive flag is Inactive', () => {
    expect(
      deriveVoucherStatus({ ...base, isActive: VoucherActiveStatus.Inactive }),
    ).toBe('inactive');
  });

  it('returns active when within date range and not sold out', () => {
    expect(deriveVoucherStatus(base)).toBe('active');
  });

  it('returns sold_out when qty > 0 and usedCount >= qty', () => {
    expect(deriveVoucherStatus({ ...base, qty: 100, usedCount: 100 })).toBe(
      'sold_out',
    );
    expect(deriveVoucherStatus({ ...base, qty: 100, usedCount: 101 })).toBe(
      'sold_out',
    );
  });

  it('does NOT return sold_out when qty is 0 (unlimited)', () => {
    expect(deriveVoucherStatus({ ...base, qty: 0, usedCount: 1000 })).toBe(
      'active',
    );
  });

  it('sold_out wins over upcoming (date order: qty check first)', () => {
    expect(
      deriveVoucherStatus({
        ...base,
        qty: 10,
        usedCount: 10,
        startedAt: '2026-05-01T00:00:00+07:00',
      }),
    ).toBe('sold_out');
  });

  it('returns upcoming when now before startedAt and not sold out', () => {
    expect(
      deriveVoucherStatus({
        ...base,
        startedAt: '2026-05-01T00:00:00+07:00',
        expiredAt: '2026-05-31T23:59:59+07:00',
      }),
    ).toBe('upcoming');
  });

  it('returns expired when now after expiredAt', () => {
    expect(
      deriveVoucherStatus({
        ...base,
        startedAt: '2026-03-01T00:00:00+07:00',
        expiredAt: '2026-03-31T23:59:59+07:00',
      }),
    ).toBe('expired');
  });

  it('returns active when both dates null', () => {
    expect(
      deriveVoucherStatus({ ...base, startedAt: null, expiredAt: null }),
    ).toBe('active');
  });

  it('Inactive flag wins over everything', () => {
    expect(
      deriveVoucherStatus({
        ...base,
        isActive: VoucherActiveStatus.Inactive,
        qty: 10,
        usedCount: 10,
        startedAt: '2026-05-01T00:00:00+07:00',
      }),
    ).toBe('inactive');
  });
});
