import { describe, it, expect } from 'vitest';
import {
  formatCustomerDateTime,
  formatCustomerDate,
  formatCustomerPhone,
} from './formatters';

describe('formatCustomerDateTime', () => {
  it('returns "-" for falsy input', () => {
    expect(formatCustomerDateTime(null)).toBe('-');
    expect(formatCustomerDateTime(undefined)).toBe('-');
    expect(formatCustomerDateTime('')).toBe('-');
  });

  it('delegates to formatWibDateTime for valid ISO', () => {
    expect(formatCustomerDateTime('2026-04-01T10:30:00+07:00')).toBe(
      '01/04/2026 10:30',
    );
  });
});

describe('formatCustomerDate', () => {
  it('returns "-" for falsy input', () => {
    expect(formatCustomerDate(null)).toBe('-');
    expect(formatCustomerDate(undefined)).toBe('-');
    expect(formatCustomerDate('')).toBe('-');
  });

  it('returns "-" for invalid date string', () => {
    expect(formatCustomerDate('not-a-date')).toBe('-');
  });

  it('formats valid ISO in long format (English months)', () => {
    expect(formatCustomerDate('2026-04-15T00:00:00+07:00')).toBe(
      '15 April 2026',
    );
  });
});

describe('formatCustomerPhone', () => {
  it('prefers phone when provided', () => {
    expect(formatCustomerPhone('08120001', '08120002')).toBe('08120001');
  });

  it('falls back to phoneNumber when phone empty/null/undefined', () => {
    expect(formatCustomerPhone(null, '08120002')).toBe('08120002');
    expect(formatCustomerPhone(undefined, '08120002')).toBe('08120002');
    expect(formatCustomerPhone('', '08120002')).toBe('08120002');
  });

  it('returns "-" when both falsy', () => {
    expect(formatCustomerPhone(null, null)).toBe('-');
    expect(formatCustomerPhone(undefined, undefined)).toBe('-');
    expect(formatCustomerPhone('', '')).toBe('-');
  });
});
