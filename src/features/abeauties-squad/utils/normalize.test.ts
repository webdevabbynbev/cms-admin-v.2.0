import { describe, it, expect } from 'vitest';
import { normalizeSquadMember } from './normalize';

describe('normalizeSquadMember', () => {
  it('returns defaults for empty input', () => {
    expect(normalizeSquadMember({})).toEqual({
      id: 0,
      fullName: '',
      gender: null,
      instagramUsername: null,
      tiktokUsername: null,
      whatsappNumber: null,
      domisili: null,
      instagramProofUrl: null,
      tiktokProofUrl: null,
      status: 'pending',
      adminNotes: null,
      userType: null,
      createdAt: null,
    });
  });

  it('handles null/undefined raw input', () => {
    expect(normalizeSquadMember(null).id).toBe(0);
    expect(normalizeSquadMember(undefined).id).toBe(0);
  });

  it('reads camelCase fields', () => {
    const result = normalizeSquadMember({
      id: 1,
      fullName: 'Abby Bev',
      gender: 'female',
      instagramUsername: '@abby',
      tiktokUsername: '@bev',
      whatsappNumber: '0812',
      domisili: 'Jakarta',
      instagramProofUrl: 'http://x/ig.png',
      tiktokProofUrl: 'http://x/tt.png',
      adminNotes: 'looks good',
      createdAt: '2026-04-01',
    });
    expect(result.fullName).toBe('Abby Bev');
    expect(result.instagramUsername).toBe('@abby');
    expect(result.whatsappNumber).toBe('0812');
    expect(result.instagramProofUrl).toBe('http://x/ig.png');
    expect(result.adminNotes).toBe('looks good');
  });

  it('reads snake_case fallbacks', () => {
    const result = normalizeSquadMember({
      full_name: 'Snake Case',
      instagram_username: '@sc',
      tiktok_username: '@sc_tt',
      whatsapp_number: '0821',
      instagram_proof_url: 'http://x/sc_ig.png',
      tiktok_proof_url: 'http://x/sc_tt.png',
      admin_notes: 'note',
      user_type: 'kol',
      created_at: '2026-04-02',
    });
    expect(result.fullName).toBe('Snake Case');
    expect(result.instagramUsername).toBe('@sc');
    expect(result.tiktokUsername).toBe('@sc_tt');
    expect(result.whatsappNumber).toBe('0821');
    expect(result.adminNotes).toBe('note');
    expect(result.userType).toBe('kol');
    expect(result.createdAt).toBe('2026-04-02');
  });

  it('status: coerces approved/rejected/pending (case-insensitive)', () => {
    expect(normalizeSquadMember({ status: 'approved' }).status).toBe('approved');
    expect(normalizeSquadMember({ status: 'APPROVED' }).status).toBe('approved');
    expect(normalizeSquadMember({ status: 'Rejected' }).status).toBe('rejected');
    expect(normalizeSquadMember({ status: 'pending' }).status).toBe('pending');
  });

  it('status: unknown values fall back to pending', () => {
    expect(normalizeSquadMember({ status: 'weird' }).status).toBe('pending');
    expect(normalizeSquadMember({ status: '' }).status).toBe('pending');
    expect(normalizeSquadMember({ status: null }).status).toBe('pending');
    expect(normalizeSquadMember({}).status).toBe('pending');
  });

  it('userType: coerces abeauties/kol (case-insensitive)', () => {
    expect(normalizeSquadMember({ userType: 'abeauties' }).userType).toBe('abeauties');
    expect(normalizeSquadMember({ userType: 'KOL' }).userType).toBe('kol');
    expect(normalizeSquadMember({ user_type: 'Abeauties' }).userType).toBe(
      'abeauties',
    );
  });

  it('userType: unknown values return null', () => {
    expect(normalizeSquadMember({ userType: 'admin' }).userType).toBeNull();
    expect(normalizeSquadMember({ userType: '' }).userType).toBeNull();
    expect(normalizeSquadMember({}).userType).toBeNull();
  });
});
