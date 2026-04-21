export interface RamadanSpinPrize {
  id: number;
  name: string;
  weight: number;
  isGrand: boolean;
  isActive: boolean;
  dailyQuota: number | null;
  voucherId: number | null;
  voucherQty: number;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface RamadanRecommendation {
  id: number;
  productId: number | null;
  productName: string;
  position: number;
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface RamadanRecommendationBanner {
  id: number;
  title: string;
  bannerDate: string | null;
  imageUrl: string | null;
  imageType: string;
  imageMobileUrl: string | null;
  imageMobileType: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface RamadanParticipant {
  id: number;
  name: string;
  email: string;
  phoneNumber: string | null;
  address: string | null;
  totalFasting: number;
  totalNotFasting: number;
  notFastingReasons: string | null;
  spinResult: string | null;
  prize7: string | null;
  prize15: string | null;
  prize30: string | null;
}

export interface RamadanListQuery {
  q?: string;
  page: number;
  perPage: number;
}

export interface RamadanSpinPrizePayload {
  name: string;
  weight: number;
  is_grand: boolean;
  is_active: boolean;
  daily_quota: number | null;
  voucher_id: number | null;
  voucher_qty: number;
}

export interface RamadanRecommendationPayload {
  product_id: number | null;
  product_name: string;
  position: number;
  is_active: boolean;
}

export interface RamadanRecommendationBannerPayload {
  title: string;
  banner_date: string | null;
  image_url: string | null;
  image_type: string;
  image_mobile_url: string | null;
  image_mobile_type: string;
}
