export interface CrmMember {
  id: number;
  name: string;
  email: string;
  phoneNumber: string | null;
  photoProfileUrl: string | null;
  isActive: boolean;
  emailVerified: string | null;
  crmTier: string;
  referralCode: string | null;
  totalOrders: number;
  ltv: number;
  section: string | null;
  profileCompletion: number;
  createdAt?: string | null;
}

export interface CrmAffiliate {
  id: number;
  code: string;
  discountPercent: number;
  isActive: boolean;
  expiredAt: string | null;
  totalRedemptions: number;
  totalDiscountGiven: number;
  komisiEarned: number;
  createdAt?: string | null;
}

export interface CrmListQuery {
  q?: string;
  page: number;
  perPage: number;
}
