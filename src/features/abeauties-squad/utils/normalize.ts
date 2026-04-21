import type { AbeautiesSquadMember, AbeautiesStatus, AbeautiesUserType } from '../types';

type UnknownRecord = Record<string, unknown>;

function pick<T>(source: UnknownRecord, ...keys: string[]): T | undefined {
  for (const key of keys) {
    const v = source[key];
    if (v !== undefined && v !== null) return v as T;
  }
  return undefined;
}

function toStatus(value: unknown): AbeautiesStatus {
  const v = String(value ?? 'pending').toLowerCase();
  if (v === 'approved' || v === 'rejected') return v;
  return 'pending';
}

function toUserType(value: unknown): AbeautiesUserType | null {
  const v = String(value ?? '').toLowerCase();
  if (v === 'abeauties' || v === 'kol') return v;
  return null;
}

export function normalizeSquadMember(raw: unknown): AbeautiesSquadMember {
  const src = (raw ?? {}) as UnknownRecord;
  return {
    id: Number(pick(src, 'id') ?? 0),
    fullName: String(pick(src, 'fullName', 'full_name') ?? ''),
    gender: (pick<string>(src, 'gender') ?? null) as string | null,
    instagramUsername: (pick<string>(src, 'instagramUsername', 'instagram_username') ?? null) as string | null,
    tiktokUsername: (pick<string>(src, 'tiktokUsername', 'tiktok_username') ?? null) as string | null,
    whatsappNumber: (pick<string>(src, 'whatsappNumber', 'whatsapp_number') ?? null) as string | null,
    domisili: (pick<string>(src, 'domisili') ?? null) as string | null,
    instagramProofUrl: (pick<string>(src, 'instagramProofUrl', 'instagram_proof_url') ?? null) as string | null,
    tiktokProofUrl: (pick<string>(src, 'tiktokProofUrl', 'tiktok_proof_url') ?? null) as string | null,
    status: toStatus(pick(src, 'status')),
    adminNotes: (pick<string>(src, 'adminNotes', 'admin_notes') ?? null) as string | null,
    userType: toUserType(pick(src, 'userType', 'user_type')),
    createdAt: (pick<string>(src, 'createdAt', 'created_at') ?? null) as string | null,
  };
}
