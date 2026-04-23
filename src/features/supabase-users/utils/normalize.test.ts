import { describe, it, expect } from 'vitest';
import {
  normalizeSupabaseUser,
  normalizeSupabaseUserSummary,
} from './normalize';

describe('normalizeSupabaseUser', () => {
  it('returns defaults for empty object', () => {
    expect(normalizeSupabaseUser({})).toEqual({
      id: '',
      email: '',
      firstName: null,
      lastName: null,
      name: '',
      phoneNumber: null,
      lastSignInAt: null,
      createdAt: '',
      emailVerified: null,
      roleName: '',
      totalOrders: 0,
      ltv: 0,
      photoProfileUrl: null,
    });
  });

  it('id is coerced to string (not number)', () => {
    expect(normalizeSupabaseUser({ id: 42 }).id).toBe('42');
    expect(normalizeSupabaseUser({ id: 'uuid-abc' }).id).toBe('uuid-abc');
  });

  it('reads camelCase fields', () => {
    const result = normalizeSupabaseUser({
      id: 'u1',
      email: 'a@b.com',
      firstName: 'Abby',
      lastName: 'Bev',
      phoneNumber: '0812',
      lastSignInAt: '2026-04-01T10:00:00Z',
      createdAt: '2026-01-01',
      emailVerified: 1,
      roleName: 'Customer',
      totalOrders: 5,
      ltv: 500000,
      photoProfileUrl: 'http://x/p.jpg',
    });
    expect(result.email).toBe('a@b.com');
    expect(result.firstName).toBe('Abby');
    expect(result.name).toBe('Abby Bev');
    expect(result.lastSignInAt).toBe('2026-04-01T10:00:00Z');
    expect(result.emailVerified).toBe(1);
    expect(result.totalOrders).toBe(5);
    expect(result.ltv).toBe(500000);
  });

  it('reads snake_case fallbacks', () => {
    const result = normalizeSupabaseUser({
      first_name: 'Snake',
      last_name: 'Case',
      phone_number: '0821',
      last_sign_in_at: '2026-04-02',
      created_at: '2026-02-01',
      email_verified: 1,
      role_name: 'Admin',
      total_orders: 3,
      photo_profile_url: 'http://x/sc.jpg',
    });
    expect(result.firstName).toBe('Snake');
    expect(result.lastName).toBe('Case');
    expect(result.phoneNumber).toBe('0821');
    expect(result.lastSignInAt).toBe('2026-04-02');
    expect(result.createdAt).toBe('2026-02-01');
    expect(result.emailVerified).toBe(1);
    expect(result.roleName).toBe('Admin');
    expect(result.totalOrders).toBe(3);
    expect(result.photoProfileUrl).toBe('http://x/sc.jpg');
  });

  it('name: joins firstName + lastName', () => {
    expect(normalizeSupabaseUser({ firstName: 'A', lastName: 'B' }).name).toBe(
      'A B',
    );
  });

  it('name: uses only firstName when lastName missing', () => {
    expect(normalizeSupabaseUser({ firstName: 'Solo' }).name).toBe('Solo');
  });

  it('name: uses only lastName when firstName missing', () => {
    expect(normalizeSupabaseUser({ lastName: 'Only' }).name).toBe('Only');
  });

  it('name: falls back to `name` field when no first/last', () => {
    expect(normalizeSupabaseUser({ name: 'Fallback' }).name).toBe('Fallback');
  });

  it('name: falls back to email when no first/last/name', () => {
    expect(normalizeSupabaseUser({ email: 'foo@bar.com' }).name).toBe(
      'foo@bar.com',
    );
  });

  it('name: empty string when nothing provided', () => {
    expect(normalizeSupabaseUser({}).name).toBe('');
  });

  it('emailVerified null when absent', () => {
    expect(normalizeSupabaseUser({}).emailVerified).toBeNull();
  });

  it('ltv coerces numeric string', () => {
    expect(normalizeSupabaseUser({ ltv: '999999' }).ltv).toBe(999999);
  });
});

describe('normalizeSupabaseUserSummary', () => {
  it('returns defaults for empty object', () => {
    expect(normalizeSupabaseUserSummary({})).toEqual({
      totalUsers: 0,
      totalTransactions: 0,
      totalRevenue: 0,
      averageLtv: 0,
    });
  });

  it('reads camelCase fields', () => {
    const result = normalizeSupabaseUserSummary({
      totalUsers: 100,
      totalTransactions: 250,
      totalRevenue: 5000000,
      averageLtv: 50000,
    });
    expect(result).toEqual({
      totalUsers: 100,
      totalTransactions: 250,
      totalRevenue: 5000000,
      averageLtv: 50000,
    });
  });

  it('reads snake_case fallbacks', () => {
    const result = normalizeSupabaseUserSummary({
      total_users: 10,
      total_transactions: 20,
      total_revenue: 300000,
      average_ltv: 30000,
    });
    expect(result).toEqual({
      totalUsers: 10,
      totalTransactions: 20,
      totalRevenue: 300000,
      averageLtv: 30000,
    });
  });

  it('averageLtv reads avg_ltv as third fallback', () => {
    expect(normalizeSupabaseUserSummary({ avg_ltv: 12345 }).averageLtv).toBe(
      12345,
    );
  });

  it('averageLtv prefers camelCase over snake_case over avg_ltv', () => {
    const result = normalizeSupabaseUserSummary({
      averageLtv: 1,
      average_ltv: 2,
      avg_ltv: 3,
    });
    expect(result.averageLtv).toBe(1);
  });
});
