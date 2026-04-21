import type { ProductListQuery } from '@/features/products/types';
import type { BannerListQuery } from '@/features/banner/types';
import type {
  DiscountListQuery,
  DiscountOptionQuery,
} from '@/features/discounts/types';
import type { VoucherListQuery } from '@/features/vouchers/types';
import type { CustomerListQuery } from '@/features/customers/types';
import type { SettingListQuery } from '@/features/settings/types';
import type { AdminListQuery } from '@/features/admins/types';
import type { FaqListQuery } from '@/features/faqs/types';
import type { ActivityLogListQuery } from '@/features/activity-logs/types';
import type { ContentSlug } from '@/features/content-pages/types';
import type { TagListQuery } from '@/features/tags/types';
import type { PersonaListQuery } from '@/features/personas/types';
import type { BrandListQuery } from '@/features/brands/types';
import type { CategoryTypeListQuery } from '@/features/category-types/types';
import type {
  ConcernListQuery,
  ConcernOptionListQuery,
} from '@/features/concerns/types';
import type {
  ProfileCategoryListQuery,
  ProfileCategoryOptionListQuery,
} from '@/features/profile-categories/types';
import type { ReferralCodeListQuery } from '@/features/referral-codes/types';
import type { GiftListQuery } from '@/features/gifts/types';
import type { B1g1ListQuery } from '@/features/b1g1/types';
import type { NedListQuery } from '@/features/ned/types';
import type { RamadanListQuery } from '@/features/ramadan/types';
import type { HomeBannerSectionListQuery } from '@/features/home-banners/types';
import type { CrmListQuery } from '@/features/crm/types';
import type { StockMovementListQuery } from '@/features/stock-movements/types';
import type { AbandonedCartListQuery } from '@/features/abandoned-carts/types';
import type { AbeautiesSquadListQuery } from '@/features/abeauties-squad/types';
import type { TransactionListQuery } from '@/features/transactions/types';
import type { SupabaseUserListQuery } from '@/features/supabase-users/types';
import type { PickListQuery } from '@/features/picks/types';
import type { SaleListQuery } from '@/features/sale/types';
// Flash sale has no list filters; uses single root key

export const QUERY_KEYS = {
  dashboard: {
    stats: ['dashboard', 'stats'] as const,
    topProducts: ['dashboard', 'top-products'] as const,
    leastProducts: ['dashboard', 'least-products'] as const,
    transactionPeriod: ['dashboard', 'transaction-period'] as const,
    userRegistrationPeriod: ['dashboard', 'user-registration-period'] as const,
    traffic: (days: number) => ['dashboard', 'traffic', days] as const,
  },
  products: {
    root: ['products'] as const,
    list: (filters: ProductListQuery) => ['products', 'list', filters] as const,
    detail: (id: number | string) => ['products', 'detail', id] as const,
  },
  banners: {
    root: ['banners'] as const,
    list: (filters: BannerListQuery) => ['banners', 'list', filters] as const,
    detail: (id: number | string) => ['banners', 'detail', id] as const,
  },
  discounts: {
    root: ['discounts'] as const,
    list: (filters: DiscountListQuery) =>
      ['discounts', 'list', filters] as const,
    detail: (identifier: number | string) =>
      ['discounts', 'detail', identifier] as const,
    brandOptions: (filters: DiscountOptionQuery) =>
      ['discounts', 'options', 'brands', filters] as const,
    productOptions: (filters: DiscountOptionQuery) =>
      ['discounts', 'options', 'products', filters] as const,
    variantOptions: (filters: DiscountOptionQuery) =>
      ['discounts', 'options', 'variants', filters] as const,
  },
  vouchers: {
    root: ['vouchers'] as const,
    list: (filters: VoucherListQuery) =>
      ['vouchers', 'list', filters] as const,
    detail: (id: number | string) => ['vouchers', 'detail', id] as const,
  },
  flashSales: {
    root: ['flash-sales'] as const,
    list: ['flash-sales', 'list'] as const,
    detail: (id: number | string) => ['flash-sales', 'detail', id] as const,
  },
  customers: {
    root: ['customers'] as const,
    list: (filters: CustomerListQuery) =>
      ['customers', 'list', filters] as const,
  },
  settings: {
    root: ['settings'] as const,
    list: (filters: SettingListQuery) =>
      ['settings', 'list', filters] as const,
  },
  admins: {
    root: ['admins'] as const,
    list: (filters: AdminListQuery) => ['admins', 'list', filters] as const,
    detail: (id: number | string) => ['admins', 'detail', id] as const,
  },
  faqs: {
    root: ['faqs'] as const,
    list: (filters: FaqListQuery) => ['faqs', 'list', filters] as const,
  },
  activityLogs: {
    root: ['activity-logs'] as const,
    list: (filters: ActivityLogListQuery) =>
      ['activity-logs', 'list', filters] as const,
  },
  contentPages: {
    root: ['content-pages'] as const,
    detail: (slug: ContentSlug) => ['content-pages', slug] as const,
  },
  tags: {
    root: ['tags'] as const,
    list: (filters: TagListQuery) => ['tags', 'list', filters] as const,
  },
  personas: {
    root: ['personas'] as const,
    list: (filters: PersonaListQuery) =>
      ['personas', 'list', filters] as const,
  },
  brands: {
    root: ['brands'] as const,
    list: (filters: BrandListQuery) => ['brands', 'list', filters] as const,
  },
  categoryTypes: {
    root: ['category-types'] as const,
    list: (filters: CategoryTypeListQuery) =>
      ['category-types', 'list', filters] as const,
    flat: ['category-types', 'flat'] as const,
  },
  concerns: {
    root: ['concerns'] as const,
    list: (filters: ConcernListQuery) =>
      ['concerns', 'list', filters] as const,
    optionList: (filters: ConcernOptionListQuery) =>
      ['concerns', 'options', filters] as const,
  },
  profileCategories: {
    root: ['profile-categories'] as const,
    list: (filters: ProfileCategoryListQuery) =>
      ['profile-categories', 'list', filters] as const,
    optionList: (filters: ProfileCategoryOptionListQuery) =>
      ['profile-categories', 'options', filters] as const,
  },
  referralCodes: {
    root: ['referral-codes'] as const,
    list: (filters: ReferralCodeListQuery) =>
      ['referral-codes', 'list', filters] as const,
  },
  gifts: {
    root: ['gifts'] as const,
    list: (filters: GiftListQuery) => ['gifts', 'list', filters] as const,
  },
  b1g1: {
    root: ['b1g1'] as const,
    list: (filters: B1g1ListQuery) => ['b1g1', 'list', filters] as const,
  },
  neds: {
    root: ['neds'] as const,
    list: (filters: NedListQuery) => ['neds', 'list', filters] as const,
  },
  ramadan: {
    root: ['ramadan'] as const,
    spinPrizes: (filters: RamadanListQuery) =>
      ['ramadan', 'spin-prizes', filters] as const,
    recommendations: (filters: RamadanListQuery) =>
      ['ramadan', 'recommendations', filters] as const,
    banners: (filters: RamadanListQuery) =>
      ['ramadan', 'banners', filters] as const,
    participants: (filters: RamadanListQuery) =>
      ['ramadan', 'participants', filters] as const,
  },
  homeBanners: {
    root: ['home-banners'] as const,
    sections: (filters: HomeBannerSectionListQuery) =>
      ['home-banners', 'sections', filters] as const,
  },
  crm: {
    root: ['crm'] as const,
    members: (filters: CrmListQuery) => ['crm', 'members', filters] as const,
    affiliates: (filters: CrmListQuery) =>
      ['crm', 'affiliates', filters] as const,
  },
  stockMovements: {
    root: ['stock-movements'] as const,
    list: (filters: StockMovementListQuery) =>
      ['stock-movements', 'list', filters] as const,
  },
  abandonedCarts: {
    root: ['abandoned-carts'] as const,
    list: (filters: AbandonedCartListQuery) =>
      ['abandoned-carts', 'list', filters] as const,
  },
  abeautiesSquad: {
    root: ['abeauties-squad'] as const,
    list: (filters: AbeautiesSquadListQuery) =>
      ['abeauties-squad', 'list', filters] as const,
  },
  transactions: {
    root: ['transactions'] as const,
    list: (filters: TransactionListQuery) => ['transactions', 'list', filters] as const,
    detail: (id: number | string) => ['transactions', 'detail', id] as const,
  },
  supabaseUsers: {
    root: ['supabase-users'] as const,
    list: (filters: SupabaseUserListQuery) => ['supabase-users', 'list', filters] as const,
    summary: (filters: SupabaseUserListQuery) => ['supabase-users', 'summary', filters] as const,
  },
  picks: {
    root: (endpoint: string) => ['picks', endpoint] as const,
    list: (endpoint: string, filters: PickListQuery) =>
      ['picks', endpoint, 'list', filters] as const,
  },
  sales: {
    root: ['sales'] as const,
    list: (filters: SaleListQuery) => ['sales', 'list', filters] as const,
    detail: (id: number | string) => ['sales', 'detail', id] as const,
  },
  references: {
    // legacy references — superseded by top-level feature keys above but still used by Products hook
    attributes: ['references', 'attributes'] as const,
    brands: ['references', 'brands'] as const,
    categoryTypes: ['references', 'category-types'] as const,
    personas: ['references', 'personas'] as const,
    concerns: ['references', 'concerns'] as const,
    profileCategories: ['references', 'profile-categories'] as const,
  },
} as const;
