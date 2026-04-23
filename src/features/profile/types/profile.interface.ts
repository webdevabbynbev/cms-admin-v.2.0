export interface UpdateProfilePayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  photoProfile?: string | null;
}
