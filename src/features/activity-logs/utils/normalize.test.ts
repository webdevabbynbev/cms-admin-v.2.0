import { describe, it, expect } from 'vitest';
import { normalizeActivityLog } from './normalize';

describe('normalizeActivityLog', () => {
  it('returns defaults for empty input', () => {
    expect(normalizeActivityLog({})).toEqual({
      id: 0,
      roleName: '',
      userName: '',
      activity: '',
      menu: null,
      data: null,
      dataArray: null,
      createdAt: null,
      updatedAt: null,
    });
  });

  it('handles null/undefined raw input', () => {
    expect(normalizeActivityLog(null).id).toBe(0);
    expect(normalizeActivityLog(undefined).id).toBe(0);
  });

  it('reads camelCase fields', () => {
    const result = normalizeActivityLog({
      id: 1,
      roleName: 'admin',
      userName: 'Abby',
      activity: 'CREATE',
      menu: 'Products',
      createdAt: '2026-04-01',
      updatedAt: '2026-04-02',
    });
    expect(result.roleName).toBe('admin');
    expect(result.userName).toBe('Abby');
    expect(result.activity).toBe('CREATE');
    expect(result.menu).toBe('Products');
  });

  it('reads snake_case fallbacks', () => {
    const result = normalizeActivityLog({
      role_name: 'admin',
      user_name: 'Abby',
      created_at: '2026-04-01',
      updated_at: '2026-04-02',
    });
    expect(result.roleName).toBe('admin');
    expect(result.userName).toBe('Abby');
    expect(result.createdAt).toBe('2026-04-01');
    expect(result.updatedAt).toBe('2026-04-02');
  });

  it('parses dataArray from JSON string', () => {
    const result = normalizeActivityLog({
      data: '{"productId":123,"field":"name"}',
    });
    expect(result.data).toBe('{"productId":123,"field":"name"}');
    expect(result.dataArray).toEqual({ productId: 123, field: 'name' });
  });

  it('reads dataArray when already an object', () => {
    const result = normalizeActivityLog({
      dataArray: { foo: 'bar', count: 3 },
    });
    expect(result.dataArray).toEqual({ foo: 'bar', count: 3 });
  });

  it('reads data_array snake_case fallback for dataArray', () => {
    const result = normalizeActivityLog({
      data_array: { x: 1 },
    });
    expect(result.dataArray).toEqual({ x: 1 });
  });

  it('dataArray falls back to parsing `data` field when dataArray absent', () => {
    const result = normalizeActivityLog({
      data: '{"key":"val"}',
    });
    expect(result.dataArray).toEqual({ key: 'val' });
  });

  it('dataArray is null when data is unparseable JSON', () => {
    const result = normalizeActivityLog({
      data: 'not-json',
    });
    expect(result.dataArray).toBeNull();
  });

  it('dataArray is null when JSON parses to primitive', () => {
    expect(normalizeActivityLog({ data: '"just a string"' }).dataArray).toBeNull();
    expect(normalizeActivityLog({ data: '42' }).dataArray).toBeNull();
    expect(normalizeActivityLog({ data: 'null' }).dataArray).toBeNull();
  });

  it('dataArray prefers parsed dataArray over data fallback', () => {
    const result = normalizeActivityLog({
      dataArray: { primary: true },
      data: '{"secondary":true}',
    });
    expect(result.dataArray).toEqual({ primary: true });
  });

  it('data field preserved as raw string even when dataArray parsed', () => {
    const result = normalizeActivityLog({
      data: '{"a":1}',
    });
    expect(result.data).toBe('{"a":1}');
    expect(result.dataArray).toEqual({ a: 1 });
  });

  it('menu stays null when absent', () => {
    expect(normalizeActivityLog({ id: 1 }).menu).toBeNull();
  });
});
