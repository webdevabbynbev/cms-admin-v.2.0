import { describe, it, expect } from 'vitest';
import { normalizeCustomer } from './normalize';
import { CustomerGender } from '../types';

describe('normalizeCustomer', () => {
  it('returns defaults for empty input', () => {
    const result = normalizeCustomer({});
    expect(result).toEqual({
      id: 0,
      firstName: '',
      lastName: '',
      name: '',
      email: '',
      phone: null,
      phoneNumber: null,
      gender: CustomerGender.Unspecified,
      dob: null,
      address: null,
      isActive: true,
      role: null,
      roleName: null,
      crmTier: null,
      referralCode: null,
      emailVerified: null,
      photoProfileUrl: null,
      createdAt: null,
      updatedAt: null,
    });
  });

  it('handles null/undefined raw input', () => {
    expect(normalizeCustomer(null).id).toBe(0);
    expect(normalizeCustomer(undefined).id).toBe(0);
  });

  it('reads camelCase fields', () => {
    const result = normalizeCustomer({
      id: 42,
      firstName: 'Abby',
      lastName: 'Bev',
      email: 'a@b.com',
      phoneNumber: '0812',
      isActive: false,
    });
    expect(result.id).toBe(42);
    expect(result.firstName).toBe('Abby');
    expect(result.lastName).toBe('Bev');
    expect(result.name).toBe('Abby Bev');
    expect(result.phoneNumber).toBe('0812');
    expect(result.isActive).toBe(false);
  });

  it('reads snake_case fallback for all fields', () => {
    const result = normalizeCustomer({
      id: 1,
      first_name: 'Abby',
      last_name: 'Bev',
      phone_number: '0812',
      is_active: true,
      role_name: 'Customer',
      crm_tier: 'gold',
      referral_code: 'ABC123',
      email_verified: '2026-01-01',
      photo_profile_url: 'http://x/y.jpg',
      created_at: '2026-01-01',
      updated_at: '2026-01-02',
    });
    expect(result.firstName).toBe('Abby');
    expect(result.phoneNumber).toBe('0812');
    expect(result.roleName).toBe('Customer');
    expect(result.crmTier).toBe('gold');
    expect(result.referralCode).toBe('ABC123');
    expect(result.photoProfileUrl).toBe('http://x/y.jpg');
  });

  it('prefers explicit name over firstName+lastName concatenation', () => {
    const result = normalizeCustomer({
      firstName: 'First',
      lastName: 'Last',
      name: 'Full Name',
    });
    expect(result.name).toBe('Full Name');
  });

  it('concatenates firstName+lastName when name missing', () => {
    expect(normalizeCustomer({ firstName: 'A', lastName: 'B' }).name).toBe('A B');
    expect(normalizeCustomer({ firstName: 'Solo' }).name).toBe('Solo');
    expect(normalizeCustomer({ lastName: 'Only' }).name).toBe('Only');
  });

  it('maps gender: 1 → Male, 2 → Female, other → Unspecified', () => {
    expect(normalizeCustomer({ gender: 1 }).gender).toBe(CustomerGender.Male);
    expect(normalizeCustomer({ gender: 2 }).gender).toBe(CustomerGender.Female);
    expect(normalizeCustomer({ gender: 0 }).gender).toBe(CustomerGender.Unspecified);
    expect(normalizeCustomer({ gender: 99 }).gender).toBe(CustomerGender.Unspecified);
    expect(normalizeCustomer({ gender: 'invalid' }).gender).toBe(
      CustomerGender.Unspecified,
    );
    expect(normalizeCustomer({ gender: '1' }).gender).toBe(CustomerGender.Male);
  });

  it('converts empty strings to null for nullable fields', () => {
    const result = normalizeCustomer({
      phone: '',
      address: '',
      dob: '',
      referral_code: '',
    });
    expect(result.phone).toBeNull();
    expect(result.address).toBeNull();
    expect(result.dob).toBeNull();
    expect(result.referralCode).toBeNull();
  });

  it('coerces number-typed role via Number()', () => {
    expect(normalizeCustomer({ role: 3 }).role).toBe(3);
    expect(normalizeCustomer({ role: '3' }).role).toBe(3);
    expect(normalizeCustomer({ role: null }).role).toBeNull();
  });

  it('defaults isActive to true when field is absent', () => {
    expect(normalizeCustomer({}).isActive).toBe(true);
  });

  it('reads photoProfile as fallback for photoProfileUrl', () => {
    expect(
      normalizeCustomer({ photoProfile: 'http://x/a.png' }).photoProfileUrl,
    ).toBe('http://x/a.png');
  });
});
