import { lazy } from 'react';
import { Navigate, Route, createHashRouter, createRoutesFromElements } from 'react-router-dom';

import { ProtectedRoute } from '@/features/auth';

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const ForgotPage = lazy(() => import('@/features/auth/pages/ForgotPage'));
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const ProductFormPage = lazy(() => import('@/features/products/pages/ProductFormPage'));
const ProductListPage = lazy(() => import('@/features/products/pages/ProductListPage'));
const BannerListPage = lazy(() => import('@/features/banner/pages/BannerListPage'));
const DiscountListPage = lazy(() => import('@/features/discounts/pages/DiscountListPage'));
const DiscountFormPage = lazy(() => import('@/features/discounts/pages/DiscountFormPage'));
const VoucherListPage = lazy(() => import('@/features/vouchers/pages/VoucherListPage'));
const VoucherFormPage = lazy(() => import('@/features/vouchers/pages/VoucherFormPage'));
const FlashSaleListPage = lazy(() => import('@/features/flash-sale/pages/FlashSaleListPage'));
const FlashSaleFormPage = lazy(() => import('@/features/flash-sale/pages/FlashSaleFormPage'));
const CustomerListPage = lazy(() => import('@/features/customers/pages/CustomerListPage'));
const SettingListPage = lazy(() => import('@/features/settings/pages/SettingListPage'));
const AdminListPage = lazy(() => import('@/features/admins/pages/AdminListPage'));
const RevenueReportPage = lazy(() => import('@/features/reports/pages/RevenueReportPage'));
const InventoryReportPage = lazy(() => import('@/features/reports/pages/InventoryReportPage'));
const PrivacyPolicyPage = lazy(() => import('@/features/content-pages/pages/PrivacyPolicyPage'));
const TermAndConditionsPage = lazy(
  () => import('@/features/content-pages/pages/TermAndConditionsPage'),
);
const ReturnPolicyPage = lazy(() => import('@/features/content-pages/pages/ReturnPolicyPage'));
const AboutUsPage = lazy(() => import('@/features/content-pages/pages/AboutUsPage'));
const ContactUsPage = lazy(() => import('@/features/content-pages/pages/ContactUsPage'));
const FaqListPage = lazy(() => import('@/features/faqs/pages/FaqListPage'));
const ActivityLogListPage = lazy(
  () => import('@/features/activity-logs/pages/ActivityLogListPage'),
);
const TagListPage = lazy(() => import('@/features/tags/pages/TagListPage'));
const PersonaListPage = lazy(() => import('@/features/personas/pages/PersonaListPage'));
const BrandListPage = lazy(() => import('@/features/brands/pages/BrandListPage'));
const CategoryTypeListPage = lazy(
  () => import('@/features/category-types/pages/CategoryTypeListPage'),
);
const ConcernListPage = lazy(() => import('@/features/concerns/pages/ConcernListPage'));
const ConcernOptionListPage = lazy(() => import('@/features/concerns/pages/ConcernOptionListPage'));
const ProfileCategoryListPage = lazy(
  () => import('@/features/profile-categories/pages/ProfileCategoryListPage'),
);
const ProfileCategoryOptionListPage = lazy(
  () => import('@/features/profile-categories/pages/ProfileCategoryOptionListPage'),
);
const ReferralCodeListPage = lazy(
  () => import('@/features/referral-codes/pages/ReferralCodeListPage'),
);
const GiftListPage = lazy(() => import('@/features/gifts/pages/GiftListPage'));
const B1g1ListPage = lazy(() => import('@/features/b1g1/pages/B1g1ListPage'));
const NedListPage = lazy(() => import('@/features/ned/pages/NedListPage'));
const RamadanSpinPrizeListPage = lazy(
  () => import('@/features/ramadan/pages/RamadanSpinPrizeListPage'),
);
const RamadanRecommendationListPage = lazy(
  () => import('@/features/ramadan/pages/RamadanRecommendationListPage'),
);
const RamadanBannerListPage = lazy(() => import('@/features/ramadan/pages/RamadanBannerListPage'));
const RamadanParticipantListPage = lazy(
  () => import('@/features/ramadan/pages/RamadanParticipantListPage'),
);
const HomeBannerSectionListPage = lazy(
  () => import('@/features/home-banners/pages/HomeBannerSectionListPage'),
);
const CrmMemberListPage = lazy(() => import('@/features/crm/pages/CrmMemberListPage'));
const CrmAffiliateListPage = lazy(() => import('@/features/crm/pages/CrmAffiliateListPage'));
const StockMovementListPage = lazy(
  () => import('@/features/stock-movements/pages/StockMovementListPage'),
);
const AbandonedCartListPage = lazy(
  () => import('@/features/abandoned-carts/pages/AbandonedCartListPage'),
);
const DashboardReportPage = lazy(() => import('@/features/reports/pages/DashboardReportPage'));
const SalesReportPage = lazy(() => import('@/features/reports/pages/SalesReportPage'));
const CustomerReportPage = lazy(() => import('@/features/reports/pages/CustomerReportPage'));
const TransactionReportPage = lazy(() => import('@/features/reports/pages/TransactionReportPage'));
const AbeautiesSquadListPage = lazy(
  () => import('@/features/abeauties-squad/pages/AbeautiesSquadListPage'),
);
const SeoReportPage = lazy(() => import('@/features/seo/pages/SeoReportPage'));
const TransactionListPage = lazy(() => import('@/features/transactions/pages/TransactionListPage'));
const SupabaseUserListPage = lazy(
  () => import('@/features/supabase-users/pages/SupabaseUserListPage'),
);
const AbbyPicksListPage = lazy(() => import('@/features/picks/pages/AbbyPicksListPage'));
const BevPicksListPage = lazy(() => import('@/features/picks/pages/BevPicksListPage'));
const TopPicksListPage = lazy(() => import('@/features/picks/pages/TopPicksListPage'));
const SaleListPage = lazy(() => import('@/features/sale/pages/SaleListPage'));
const SaleFormPage = lazy(() => import('@/features/sale/pages/SaleFormPage'));
const BrandLogoUploadPage = lazy(() => import('@/features/brands/pages/BrandLogoUploadPage'));
const BrandBannerUploadPage = lazy(() => import('@/features/brands/pages/BrandBannerUploadPage'));
const ProfilePage = lazy(() => import('@/features/profile/pages/ProfilePage'));

const protectedRoute = (path: string, Element: React.ComponentType) => (
  <Route
    path={path}
    element={
      <ProtectedRoute>
        <Element />
      </ProtectedRoute>
    }
  />
);

export const router = createHashRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot" element={<ForgotPage />} />

      {protectedRoute('/dashboard', DashboardPage)}

      {protectedRoute('/product-duplicate', ProductFormPage)}
      {protectedRoute('/product-form', ProductFormPage)}
      {protectedRoute('/product-form-new', ProductFormPage)}
      {protectedRoute('/products-new', ProductListPage)}
      {protectedRoute('/banners-new', BannerListPage)}

      {protectedRoute('/discounts-new', DiscountListPage)}
      {protectedRoute('/discounts-new/:id', DiscountFormPage)}

      {protectedRoute('/vouchers-new', VoucherListPage)}
      {protectedRoute('/vouchers-new/:id', VoucherFormPage)}

      {protectedRoute('/flash-sales-new', FlashSaleListPage)}
      {protectedRoute('/flash-sales-new/:id', FlashSaleFormPage)}

      {protectedRoute('/customers-new', CustomerListPage)}
      {protectedRoute('/settings-new', SettingListPage)}
      {protectedRoute('/profile-new', ProfilePage)}
      {protectedRoute('/admins-new', AdminListPage)}

      {protectedRoute('/reports-new/revenue', RevenueReportPage)}
      {protectedRoute('/reports-new/inventory', InventoryReportPage)}
      {protectedRoute('/reports-new/dashboard', DashboardReportPage)}
      {protectedRoute('/reports-new/sales', SalesReportPage)}
      {protectedRoute('/reports-new/customer', CustomerReportPage)}
      {protectedRoute('/reports-new/transaction', TransactionReportPage)}

      {protectedRoute('/privacy-policy-new', PrivacyPolicyPage)}
      {protectedRoute('/tnc-new', TermAndConditionsPage)}
      {protectedRoute('/return-policy-new', ReturnPolicyPage)}
      {protectedRoute('/about-us-new', AboutUsPage)}
      {protectedRoute('/contact-us-new', ContactUsPage)}

      {protectedRoute('/faqs-new', FaqListPage)}
      {protectedRoute('/activity-logs-new', ActivityLogListPage)}

      {protectedRoute('/tags-new', TagListPage)}
      {protectedRoute('/personas-new', PersonaListPage)}
      {protectedRoute('/brands-new', BrandListPage)}
      {protectedRoute('/category-types-new', CategoryTypeListPage)}
      {protectedRoute('/concerns-new', ConcernListPage)}
      {protectedRoute('/concern-options-new', ConcernOptionListPage)}
      {protectedRoute('/profile-categories-new', ProfileCategoryListPage)}
      {protectedRoute('/profile-category-options-new', ProfileCategoryOptionListPage)}

      {protectedRoute('/referral-codes-new', ReferralCodeListPage)}
      {protectedRoute('/gift-products-new', GiftListPage)}
      {protectedRoute('/b1g1-new', B1g1ListPage)}
      {protectedRoute('/ned-new', NedListPage)}

      {protectedRoute('/ramadan-spin-prizes-new', RamadanSpinPrizeListPage)}
      {protectedRoute('/ramadan-recommendations-new', RamadanRecommendationListPage)}
      {protectedRoute('/ramadan-banners-new', RamadanBannerListPage)}
      {protectedRoute('/ramadan-participants-new', RamadanParticipantListPage)}

      {protectedRoute('/home-banners-new', HomeBannerSectionListPage)}
      {protectedRoute('/crm-members-new', CrmMemberListPage)}
      {protectedRoute('/crm-affiliates-new', CrmAffiliateListPage)}
      {protectedRoute('/stock-movements-new', StockMovementListPage)}
      {protectedRoute('/abandoned-carts-new', AbandonedCartListPage)}

      {protectedRoute('/abeauties-squad-new', AbeautiesSquadListPage)}
      {protectedRoute('/seo-report-new', SeoReportPage)}

      {protectedRoute('/transactions-new', TransactionListPage)}
      {protectedRoute('/supabase-users-new', SupabaseUserListPage)}
      {protectedRoute('/abby-picks-new', AbbyPicksListPage)}
      {protectedRoute('/bev-picks-new', BevPicksListPage)}
      {protectedRoute('/top-picks-promo-new', TopPicksListPage)}

      {protectedRoute('/sales-new', SaleListPage)}
      {protectedRoute('/sales-new/:id', SaleFormPage)}
      {protectedRoute('/brand-bulk-upload-logo-new', BrandLogoUploadPage)}
      {protectedRoute('/brand-bulk-upload-banner-new', BrandBannerUploadPage)}

      <Route path="/master-product" element={<Navigate to="/products-new" replace />} />
      <Route path="/banners" element={<Navigate to="/banners-new" replace />} />
      <Route
        path="/products/:id/:brand/:name/medias"
        element={<Navigate to="/products-new" replace />}
      />
      <Route path="/products-media" element={<Navigate to="/products-new" replace />} />
      <Route path="/inventory-product" element={<Navigate to="/reports-new/inventory" replace />} />
      <Route path="/admin" element={<Navigate to="/admins-new" replace />} />
      <Route path="/supabase-users" element={<Navigate to="/supabase-users-new" replace />} />
      <Route path="/customers" element={<Navigate to="/customers-new" replace />} />
      <Route path="/tag-product" element={<Navigate to="/tags-new" replace />} />
      <Route path="/persona-product" element={<Navigate to="/personas-new" replace />} />
      <Route path="/homebanners" element={<Navigate to="/home-banners-new" replace />} />
      <Route path="/homebanners/:sectionId" element={<Navigate to="/home-banners-new" replace />} />
      <Route path="/activity-logs" element={<Navigate to="/activity-logs-new" replace />} />
      <Route path="/faqs" element={<Navigate to="/faqs-new" replace />} />
      <Route path="/voucher" element={<Navigate to="/vouchers-new" replace />} />
      <Route path="/voucher/new" element={<Navigate to="/vouchers-new" replace />} />
      <Route path="/voucher/:id" element={<Navigate to="/vouchers-new" replace />} />
      <Route path="/voucher/edit/:id" element={<Navigate to="/vouchers-new" replace />} />
      <Route path="/referral-codes" element={<Navigate to="/referral-codes-new" replace />} />
      <Route path="/flash-sales/new" element={<Navigate to="/flash-sales-new" replace />} />
      <Route path="/flash-sales/edit/:id" element={<Navigate to="/flash-sales-new" replace />} />
      <Route path="/privacy-policy" element={<Navigate to="/privacy-policy-new" replace />} />
      <Route path="/tnc" element={<Navigate to="/tnc-new" replace />} />
      <Route path="/return-policy" element={<Navigate to="/return-policy-new" replace />} />
      <Route path="/about-us" element={<Navigate to="/about-us-new" replace />} />
      <Route path="/contact-us" element={<Navigate to="/contact-us-new" replace />} />
      <Route path="/discounts" element={<Navigate to="/discounts-new" replace />} />
      <Route path="/discounts/new" element={<Navigate to="/discounts-new" replace />} />
      <Route path="/discounts/:id" element={<Navigate to="/discounts-new" replace />} />
      <Route path="/settings" element={<Navigate to="/settings-new" replace />} />
      <Route path="/brand-product" element={<Navigate to="/brands-new" replace />} />
      <Route
        path="/brand-bulk-upload-logo"
        element={<Navigate to="/brand-bulk-upload-logo-new" replace />}
      />
      <Route
        path="/brand-bulk-upload-banner"
        element={<Navigate to="/brand-bulk-upload-banner-new" replace />}
      />
      <Route path="/category-types" element={<Navigate to="/category-types-new" replace />} />
      <Route path="/concern" element={<Navigate to="/concerns-new" replace />} />
      <Route path="/concern-option" element={<Navigate to="/concern-options-new" replace />} />
      <Route
        path="/profile-category-filter"
        element={<Navigate to="/profile-categories-new" replace />}
      />
      <Route
        path="/profile-category-option"
        element={<Navigate to="/profile-category-options-new" replace />}
      />
      <Route path="/flash-sale" element={<Navigate to="/flash-sales-new" replace />} />
      <Route path="/sale-products" element={<Navigate to="/sales-new" replace />} />
      <Route path="/sales/new" element={<Navigate to="/sales-new" replace />} />
      <Route path="/sales/:id" element={<Navigate to="/sales-new" replace />} />
      <Route path="/transactions" element={<Navigate to="/transactions-new" replace />} />
      <Route path="/reports/dashboard" element={<Navigate to="/reports-new/dashboard" replace />} />
      <Route path="/reports/sales" element={<Navigate to="/reports-new/sales" replace />} />
      <Route
        path="/reports/transaction"
        element={<Navigate to="/reports-new/transaction" replace />}
      />
      <Route path="/reports/revenue" element={<Navigate to="/reports-new/revenue" replace />} />
      <Route path="/reports/inventory" element={<Navigate to="/reports-new/inventory" replace />} />
      <Route path="/ramadan-event" element={<Navigate to="/ramadan-participants-new" replace />} />
      <Route
        path="/ramadan-recommendation"
        element={<Navigate to="/ramadan-recommendations-new" replace />}
      />
      <Route path="/b1g1" element={<Navigate to="/b1g1-new" replace />} />
      <Route path="/gift-products" element={<Navigate to="/gift-products-new" replace />} />
      <Route path="/ned-products" element={<Navigate to="/ned-new" replace />} />
      <Route path="/crm" element={<Navigate to="/crm-members-new" replace />} />
      <Route path="/abandoned-bag" element={<Navigate to="/abandoned-carts-new" replace />} />
      <Route path="/stock-movement" element={<Navigate to="/stock-movements-new" replace />} />
      <Route
        path="/stock-movement/adjust"
        element={<Navigate to="/stock-movements-new" replace />}
      />
      <Route path="/abby-picks" element={<Navigate to="/abby-picks-new" replace />} />
      <Route path="/bev-picks" element={<Navigate to="/bev-picks-new" replace />} />
      <Route path="/top-picks-promo" element={<Navigate to="/top-picks-promo-new" replace />} />
      <Route path="/seo-report" element={<Navigate to="/seo-report-new" replace />} />
      <Route path="/abeauties-squad" element={<Navigate to="/abeauties-squad-new" replace />} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </>,
  ),
);
