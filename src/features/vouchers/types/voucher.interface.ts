import type {
  VoucherActiveStatus,
  VoucherRewardType,
  VoucherScopeType,
  VoucherType,
  VoucherValueMode,
} from './voucher.enum';

export interface Voucher {
  id: number;
  name: string;
  code: string;
  type: VoucherType;
  rewardType: VoucherRewardType | null;
  isPercentage: VoucherValueMode;
  price: number | null;
  percentage: number | null;
  maxDiscPrice: number | null;
  minPurchaseAmount: number | null;
  qty: number;
  usedCount: number;
  perUserLimit: number | null;
  isActive: VoucherActiveStatus;
  isVisible: boolean;
  isStackable: boolean;
  isVoucherStackable: boolean;
  scopeType: VoucherScopeType;
  scopeIds: number[];
  giftProductIds: number[];
  giftProductName: string | null;
  startedAt: string | null;
  expiredAt: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface VoucherListQuery {
  name?: string;
  type?: VoucherType;
  rewardType?: VoucherRewardType;
  page: number;
  perPage: number;
}

export interface VoucherFormPayload {
  id?: number;
  name: string;
  code: string;
  type: VoucherType;
  reward_type: VoucherRewardType | null;
  is_percentage: VoucherValueMode;
  price: number | null;
  percentage: number | null;
  max_disc_price: number | null;
  min_purchase_amount: number | null;
  qty: number;
  per_user_limit: number | null;
  is_active: VoucherActiveStatus;
  is_visible: boolean;
  is_stackable: boolean;
  is_voucher_stackable: boolean;
  scope_type: VoucherScopeType;
  scope_ids: number[];
  gift_product_ids: number[];
  started_at: string | null;
  expired_at: string | null;
}

export interface VoucherStatusPayload {
  id: number;
  status: VoucherActiveStatus;
}

export interface VoucherVisibilityPayload {
  id: number;
  isVisible: boolean;
}
