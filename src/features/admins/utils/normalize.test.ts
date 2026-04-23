import { describe, it, expect } from 'vitest';
import { normalizeAdmin, permissionsArrayToObject } from './normalize';
import { AdminRole } from '../types';

describe('normalizeAdmin', () => {
  it('returns defaults for empty input', () => {
    expect(normalizeAdmin({})).toEqual({
      id: 0,
      firstName: '',
      lastName: '',
      name: '',
      email: '',
      role: null,
      roleName: '',
      permissions: [],
      isActive: true,
      createdAt: null,
      updatedAt: null,
    });
  });

  it('handles null/undefined', () => {
    expect(normalizeAdmin(null).id).toBe(0);
    expect(normalizeAdmin(undefined).id).toBe(0);
  });

  it('reads camelCase + snake_case fields', () => {
    expect(
      normalizeAdmin({
        id: 5,
        first_name: 'Admin',
        last_name: 'User',
        email: 'a@b.com',
        role: 1,
        role_name: 'Admin',
        is_active: false,
      }),
    ).toMatchObject({
      id: 5,
      firstName: 'Admin',
      lastName: 'User',
      name: 'Admin User',
      email: 'a@b.com',
      role: AdminRole.Admin,
      roleName: 'Admin',
      isActive: false,
    });
  });

  it('maps valid AdminRole values', () => {
    expect(normalizeAdmin({ role: 1 }).role).toBe(AdminRole.Admin);
    expect(normalizeAdmin({ role: 3 }).role).toBe(AdminRole.Gudang);
    expect(normalizeAdmin({ role: 7 }).role).toBe(AdminRole.Cashier);
    expect(normalizeAdmin({ role: '4' }).role).toBe(AdminRole.Finance);
  });

  it('returns null role for invalid/unknown values', () => {
    expect(normalizeAdmin({ role: 2 }).role).toBeNull(); // gap in enum
    expect(normalizeAdmin({ role: 99 }).role).toBeNull();
    expect(normalizeAdmin({ role: 'garbage' }).role).toBeNull();
    expect(normalizeAdmin({ role: null }).role).toBeNull();
  });

  it('parses permissions as array', () => {
    expect(
      normalizeAdmin({ permissions: ['can_edit', 'can_delete'] }).permissions,
    ).toEqual(['can_edit', 'can_delete']);
  });

  it('filters non-string items from permissions array', () => {
    expect(
      normalizeAdmin({ permissions: ['can_edit', 123, null, 'can_delete'] }).permissions,
    ).toEqual(['can_edit', 'can_delete']);
  });

  it('parses permissions as {key: true} object', () => {
    expect(
      normalizeAdmin({ permissions: { can_edit: true, can_delete: true, can_ban: false } })
        .permissions,
    ).toEqual(['can_edit', 'can_delete']);
  });

  it('parses permissions as JSON string', () => {
    expect(
      normalizeAdmin({ permissions: '["can_edit","can_delete"]' }).permissions,
    ).toEqual(['can_edit', 'can_delete']);
    expect(
      normalizeAdmin({ permissions: '{"can_edit":true,"can_delete":true}' }).permissions,
    ).toEqual(['can_edit', 'can_delete']);
  });

  it('returns empty array for invalid permissions JSON string', () => {
    expect(normalizeAdmin({ permissions: 'not json' }).permissions).toEqual([]);
  });

  it('returns empty array for null/undefined permissions', () => {
    expect(normalizeAdmin({ permissions: null }).permissions).toEqual([]);
    expect(normalizeAdmin({}).permissions).toEqual([]);
  });
});

describe('permissionsArrayToObject', () => {
  it('converts array to true-valued object', () => {
    expect(permissionsArrayToObject(['a', 'b', 'c'])).toEqual({
      a: true,
      b: true,
      c: true,
    });
  });

  it('handles empty array', () => {
    expect(permissionsArrayToObject([])).toEqual({});
  });

  it('dedupes (later wins, stays true)', () => {
    expect(permissionsArrayToObject(['a', 'a', 'b'])).toEqual({ a: true, b: true });
  });
});
