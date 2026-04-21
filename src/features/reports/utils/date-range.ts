import moment from 'moment-timezone';
import { WIB_TZ } from '@/utils/timezone';
import { DateRangePreset } from '../types';

export interface DateRangeValue {
  preset: DateRangePreset;
  startIso: string;
  endIso: string;
}

export function buildRangeFromPreset(
  preset: Exclude<DateRangePreset, DateRangePreset.Custom>,
): DateRangeValue {
  const now = moment.tz(WIB_TZ);
  switch (preset) {
    case DateRangePreset.Today:
      return {
        preset,
        startIso: now.clone().startOf('day').toISOString(),
        endIso: now.clone().endOf('day').toISOString(),
      };
    case DateRangePreset.Last7Days:
      return {
        preset,
        startIso: now.clone().subtract(6, 'day').startOf('day').toISOString(),
        endIso: now.clone().endOf('day').toISOString(),
      };
    case DateRangePreset.ThisMonth:
      return {
        preset,
        startIso: now.clone().startOf('month').toISOString(),
        endIso: now.clone().endOf('month').toISOString(),
      };
  }
}

export function isoToDatetimeLocal(iso: string): string {
  if (!iso) return '';
  return moment.tz(iso, WIB_TZ).format('YYYY-MM-DDTHH:mm');
}

export function datetimeLocalToIso(value: string): string {
  if (!value) return '';
  return moment.tz(value, 'YYYY-MM-DDTHH:mm', WIB_TZ).toISOString();
}

export function formatRangeLabel(value: DateRangeValue): string {
  const start = moment.tz(value.startIso, WIB_TZ).format('DD MMM YYYY');
  const end = moment.tz(value.endIso, WIB_TZ).format('DD MMM YYYY');
  return `${start} — ${end}`;
}
