import { describe, it, expect } from 'vitest';
import moment from 'moment-timezone';

import { WIB_TZ } from '@/utils/timezone';
import { DateRangePreset } from '../types';
import {
  buildRangeFromPreset,
  datetimeLocalToIso,
  formatRangeLabel,
  isoToDatetimeLocal,
} from './date-range';

describe('buildRangeFromPreset', () => {
  it('Today returns start-of-day to end-of-day in WIB', () => {
    const range = buildRangeFromPreset(DateRangePreset.Today);
    const start = moment.tz(range.startIso, WIB_TZ);
    const end = moment.tz(range.endIso, WIB_TZ);

    expect(range.preset).toBe(DateRangePreset.Today);
    expect(start.format('HH:mm:ss')).toBe('00:00:00');
    expect(end.format('HH:mm:ss')).toBe('23:59:59');
    expect(start.format('YYYY-MM-DD')).toBe(end.format('YYYY-MM-DD'));
  });

  it('Last7Days returns 7-day window ending today', () => {
    const range = buildRangeFromPreset(DateRangePreset.Last7Days);
    const start = moment.tz(range.startIso, WIB_TZ);
    const end = moment.tz(range.endIso, WIB_TZ);

    expect(range.preset).toBe(DateRangePreset.Last7Days);
    expect(end.diff(start, 'day') + 1).toBe(7);
    expect(start.format('HH:mm:ss')).toBe('00:00:00');
    expect(end.format('HH:mm:ss')).toBe('23:59:59');
  });

  it('ThisMonth returns first-to-last day of current month', () => {
    const range = buildRangeFromPreset(DateRangePreset.ThisMonth);
    const start = moment.tz(range.startIso, WIB_TZ);
    const end = moment.tz(range.endIso, WIB_TZ);

    expect(range.preset).toBe(DateRangePreset.ThisMonth);
    expect(start.date()).toBe(1);
    expect(end.date()).toBe(end.daysInMonth());
    expect(start.month()).toBe(end.month());
    expect(start.year()).toBe(end.year());
  });
});

describe('isoToDatetimeLocal', () => {
  it('returns empty string for empty input', () => {
    expect(isoToDatetimeLocal('')).toBe('');
  });

  it('converts ISO UTC to WIB datetime-local format', () => {
    // 2026-04-22T05:30:00Z = 2026-04-22T12:30 WIB (+07)
    expect(isoToDatetimeLocal('2026-04-22T05:30:00.000Z')).toBe('2026-04-22T12:30');
  });

  it('converts ISO +07:00 to same datetime-local', () => {
    expect(isoToDatetimeLocal('2026-04-22T12:30:00+07:00')).toBe('2026-04-22T12:30');
  });
});

describe('datetimeLocalToIso', () => {
  it('returns empty string for empty input', () => {
    expect(datetimeLocalToIso('')).toBe('');
  });

  it('converts WIB datetime-local to UTC ISO', () => {
    // 2026-04-22T12:30 WIB = 2026-04-22T05:30 UTC
    expect(datetimeLocalToIso('2026-04-22T12:30')).toBe('2026-04-22T05:30:00.000Z');
  });

  it('roundtrips through isoToDatetimeLocal', () => {
    const iso = '2026-06-15T03:00:00.000Z';
    expect(datetimeLocalToIso(isoToDatetimeLocal(iso))).toBe(iso);
  });
});

describe('formatRangeLabel', () => {
  it('renders "DD MMM YYYY — DD MMM YYYY" in WIB', () => {
    const result = formatRangeLabel({
      preset: DateRangePreset.Custom,
      startIso: '2026-04-01T00:00:00+07:00',
      endIso: '2026-04-30T23:59:59+07:00',
    });
    expect(result).toBe('01 Apr 2026 — 30 Apr 2026');
  });

  it('handles cross-year range', () => {
    const result = formatRangeLabel({
      preset: DateRangePreset.Custom,
      startIso: '2025-12-31T17:00:00Z',
      endIso: '2026-01-01T17:00:00Z',
    });
    // 2025-12-31T17:00 UTC = 2026-01-01T00:00 WIB
    // 2026-01-01T17:00 UTC = 2026-01-02T00:00 WIB
    expect(result).toBe('01 Jan 2026 — 02 Jan 2026');
  });
});
