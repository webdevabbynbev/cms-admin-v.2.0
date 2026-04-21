import type { CustomerGender } from './customer.enum';

export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string | null;
  phoneNumber: string | null;
  gender: CustomerGender;
  dob: string | null;
  address: string | null;
  isActive: boolean;
  role: number | null;
  roleName: string | null;
  crmTier: string | null;
  referralCode: string | null;
  emailVerified: string | null;
  photoProfileUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CustomerListQuery {
  q?: string;
  page: number;
  perPage: number;
}
