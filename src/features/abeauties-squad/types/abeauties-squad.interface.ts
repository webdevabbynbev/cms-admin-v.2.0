export type AbeautiesUserType = 'abeauties' | 'kol';
export type AbeautiesStatus = 'pending' | 'approved' | 'rejected';

export interface AbeautiesSquadMember {
  id: number;
  fullName: string;
  gender: string | null;
  instagramUsername: string | null;
  tiktokUsername: string | null;
  whatsappNumber: string | null;
  domisili: string | null;
  instagramProofUrl: string | null;
  tiktokProofUrl: string | null;
  status: AbeautiesStatus;
  adminNotes: string | null;
  userType: AbeautiesUserType | null;
  createdAt: string | null;
}

export interface AbeautiesSquadListQuery {
  name?: string;
  page: number;
  perPage: number;
}

export interface AbeautiesSquadStatusPayload {
  status: 'approved' | 'rejected';
  user_type?: AbeautiesUserType;
}
