import { axiosClient } from '@/config/axios';
import type { ServeWrapper } from '@/lib/api-types';
import type { AuthUser } from '@/features/auth/types';
import type { UpdateProfilePayload } from '../types';

const PROFILE_ENDPOINTS = {
  update: '/profile',
} as const;

export const profileService = {
  async update(payload: UpdateProfilePayload): Promise<AuthUser> {
    const body = {
      first_name: payload.firstName,
      last_name: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      photo_profile: payload.photoProfile ?? undefined,
    };
    const response = await axiosClient.put<ServeWrapper<AuthUser>>(
      PROFILE_ENDPOINTS.update,
      body,
    );
    return response.data.serve;
  },
};
