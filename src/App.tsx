import { Suspense, lazy, useEffect } from "react";
import {
  RouterProvider,
  createHashRouter,
  createRoutesFromElements,
  Route,
  Navigate,
} from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import { initPerformanceMonitoring } from "./utils/analytics";
import { initServiceWorker } from "./utils/pwa";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ProtectedRoute } from "@/features/auth";

// Lazy load all pages
const LoginPage = lazy(() => import("@/features/auth/pages/LoginPage"));
const ForgotPage = lazy(() => import("@/features/auth/pages/ForgotPage"));
const DashboardPage = lazy(() => import("@/features/dashboard/pages/DashboardPage"));
const ProductFormPageNew = lazy(() => import("@/features/products/pages/ProductFormPage"));
const ProductListPageNew = lazy(() => import("@/features/products/pages/ProductListPage"));
const BannerListPageNew = lazy(() => import("@/features/banner/pages/BannerListPage"));
const DiscountListPageNew = lazy(() => import("@/features/discounts/pages/DiscountListPage"));
const DiscountFormPageNew = lazy(() => import("@/features/discounts/pages/DiscountFormPage"));
const VoucherListPageNew = lazy(() => import("@/features/vouchers/pages/VoucherListPage"));
const VoucherFormPageNew = lazy(() => import("@/features/vouchers/pages/VoucherFormPage"));
const FlashSaleListPageNew = lazy(() => import("@/features/flash-sale/pages/FlashSaleListPage"));
const FlashSaleFormPageNew = lazy(() => import("@/features/flash-sale/pages/FlashSaleFormPage"));
const CustomerListPageNew = lazy(() => import("@/features/customers/pages/CustomerListPage"));
const SettingListPageNew = lazy(() => import("@/features/settings/pages/SettingListPage"));
const AdminListPageNew = lazy(() => import("@/features/admins/pages/AdminListPage"));
const RevenueReportPageNew = lazy(() => import("@/features/reports/pages/RevenueReportPage"));
const InventoryReportPageNew = lazy(() => import("@/features/reports/pages/InventoryReportPage"));
const PrivacyPolicyPageNew = lazy(() => import("@/features/content-pages/pages/PrivacyPolicyPage"));
const TermAndConditionsPageNew = lazy(() => import("@/features/content-pages/pages/TermAndConditionsPage"));
const ReturnPolicyPageNew = lazy(() => import("@/features/content-pages/pages/ReturnPolicyPage"));
const AboutUsPageNew = lazy(() => import("@/features/content-pages/pages/AboutUsPage"));
const ContactUsPageNew = lazy(() => import("@/features/content-pages/pages/ContactUsPage"));
const FaqListPageNew = lazy(() => import("@/features/faqs/pages/FaqListPage"));
const ActivityLogListPageNew = lazy(() => import("@/features/activity-logs/pages/ActivityLogListPage"));
const TagListPageNew = lazy(() => import("@/features/tags/pages/TagListPage"));
const PersonaListPageNew = lazy(() => import("@/features/personas/pages/PersonaListPage"));
const BrandListPageNew = lazy(() => import("@/features/brands/pages/BrandListPage"));
const CategoryTypeListPageNew = lazy(() => import("@/features/category-types/pages/CategoryTypeListPage"));
const ConcernListPageNew = lazy(() => import("@/features/concerns/pages/ConcernListPage"));
const ConcernOptionListPageNew = lazy(() => import("@/features/concerns/pages/ConcernOptionListPage"));
const ProfileCategoryListPageNew = lazy(() => import("@/features/profile-categories/pages/ProfileCategoryListPage"));
const ProfileCategoryOptionListPageNew = lazy(() => import("@/features/profile-categories/pages/ProfileCategoryOptionListPage"));
const ReferralCodeListPageNew = lazy(() => import("@/features/referral-codes/pages/ReferralCodeListPage"));
const GiftListPageNew = lazy(() => import("@/features/gifts/pages/GiftListPage"));
const B1g1ListPageNew = lazy(() => import("@/features/b1g1/pages/B1g1ListPage"));
const NedListPageNew = lazy(() => import("@/features/ned/pages/NedListPage"));
const RamadanSpinPrizeListPageNew = lazy(() => import("@/features/ramadan/pages/RamadanSpinPrizeListPage"));
const RamadanRecommendationListPageNew = lazy(() => import("@/features/ramadan/pages/RamadanRecommendationListPage"));
const RamadanBannerListPageNew = lazy(() => import("@/features/ramadan/pages/RamadanBannerListPage"));
const RamadanParticipantListPageNew = lazy(() => import("@/features/ramadan/pages/RamadanParticipantListPage"));
const HomeBannerSectionListPageNew = lazy(() => import("@/features/home-banners/pages/HomeBannerSectionListPage"));
const CrmMemberListPageNew = lazy(() => import("@/features/crm/pages/CrmMemberListPage"));
const CrmAffiliateListPageNew = lazy(() => import("@/features/crm/pages/CrmAffiliateListPage"));
const StockMovementListPageNew = lazy(() => import("@/features/stock-movements/pages/StockMovementListPage"));
const AbandonedCartListPageNew = lazy(() => import("@/features/abandoned-carts/pages/AbandonedCartListPage"));
const DashboardReportPageNew = lazy(() => import("@/features/reports/pages/DashboardReportPage"));
const SalesReportPageNew = lazy(() => import("@/features/reports/pages/SalesReportPage"));
const CustomerReportPageNew = lazy(() => import("@/features/reports/pages/CustomerReportPage"));
const TransactionReportPageNew = lazy(() => import("@/features/reports/pages/TransactionReportPage"));
const AbeautiesSquadListPageNew = lazy(() => import("@/features/abeauties-squad/pages/AbeautiesSquadListPage"));
const SeoReportPageNew = lazy(() => import("@/features/seo/pages/SeoReportPage"));
const TransactionListPageNew = lazy(() => import("@/features/transactions/pages/TransactionListPage"));
const SupabaseUserListPageNew = lazy(() => import("@/features/supabase-users/pages/SupabaseUserListPage"));
const AbbyPicksListPageNew = lazy(() => import("@/features/picks/pages/AbbyPicksListPage"));
const BevPicksListPageNew = lazy(() => import("@/features/picks/pages/BevPicksListPage"));
const TopPicksListPageNew = lazy(() => import("@/features/picks/pages/TopPicksListPage"));
const SaleListPageNew = lazy(() => import("@/features/sale/pages/SaleListPage"));
const SaleFormPageNew = lazy(() => import("@/features/sale/pages/SaleFormPage"));
const BrandLogoUploadPageNew = lazy(() => import("@/features/brands/pages/BrandLogoUploadPage"));
const BrandBannerUploadPageNew = lazy(() => import("@/features/brands/pages/BrandBannerUploadPage"));


import { useThemeStore } from "./hooks/useThemeStore";
import CsvImportWatcher from "@/features/products/components/CsvImportWatcher";

const router = createHashRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/master-product" element={<Navigate to="/products-new" replace />} />
      <Route path="/banners" element={<Navigate to="/banners-new" replace />} />

      <Route path="/products/:id/:brand/:name/medias" element={<Navigate to="/products-new" replace />} />
      <Route path="/products-media" element={<Navigate to="/products-new" replace />} />

      <Route
        path="/product-duplicate"
        element={
          <ProtectedRoute>
            <ProductFormPageNew />
          </ProtectedRoute>
        }
      />

      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot" element={<ForgotPage />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/product-form"
        element={
          <ProtectedRoute>
            <ProductFormPageNew />
          </ProtectedRoute>
        }
      />

      <Route
        path="/product-form-new"
        element={
          <ProtectedRoute>
            <ProductFormPageNew />
          </ProtectedRoute>
        }
      />

      <Route
        path="/products-new"
        element={
          <ProtectedRoute>
            <ProductListPageNew />
          </ProtectedRoute>
        }
      />
      <Route
        path="/banners-new"
        element={
          <ProtectedRoute>
            <BannerListPageNew />
          </ProtectedRoute>
        }
      />

      {/* v1.5 Discounts (parallel to old /discounts) */}
      <Route
        path="/discounts-new"
        element={
          <ProtectedRoute>
            <DiscountListPageNew />
          </ProtectedRoute>
        }
      />
      <Route
        path="/discounts-new/:id"
        element={
          <ProtectedRoute>
            <DiscountFormPageNew />
          </ProtectedRoute>
        }
      />

      {/* v1.5 Vouchers (parallel to old /voucher) */}
      <Route
        path="/vouchers-new"
        element={
          <ProtectedRoute>
            <VoucherListPageNew />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vouchers-new/:id"
        element={
          <ProtectedRoute>
            <VoucherFormPageNew />
          </ProtectedRoute>
        }
      />

      {/* v1.5 Flash Sale (parallel to old /sale) */}
      <Route
        path="/flash-sales-new"
        element={
          <ProtectedRoute>
            <FlashSaleListPageNew />
          </ProtectedRoute>
        }
      />
      <Route
        path="/flash-sales-new/:id"
        element={
          <ProtectedRoute>
            <FlashSaleFormPageNew />
          </ProtectedRoute>
        }
      />

      {/* v1.5 Customers (parallel to old /customer) */}
      <Route
        path="/customers-new"
        element={
          <ProtectedRoute>
            <CustomerListPageNew />
          </ProtectedRoute>
        }
      />

      {/* v1.5 Settings (parallel to old /settings) */}
      <Route
        path="/settings-new"
        element={
          <ProtectedRoute>
            <SettingListPageNew />
          </ProtectedRoute>
        }
      />

      {/* v1.5 Admin Management (parallel to old /admin) */}
      <Route
        path="/admins-new"
        element={
          <ProtectedRoute>
            <AdminListPageNew />
          </ProtectedRoute>
        }
      />

      {/* v1.5 Reports (parallel to old /reports/*) */}
      <Route
        path="/reports-new/revenue"
        element={
          <ProtectedRoute>
            <RevenueReportPageNew />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports-new/inventory"
        element={
          <ProtectedRoute>
            <InventoryReportPageNew />
          </ProtectedRoute>
        }
      />

      {/* v1.5 Content CMS */}
      <Route
        path="/privacy-policy-new"
        element={
          <ProtectedRoute>
            <PrivacyPolicyPageNew />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tnc-new"
        element={
          <ProtectedRoute>
            <TermAndConditionsPageNew />
          </ProtectedRoute>
        }
      />
      <Route
        path="/return-policy-new"
        element={
          <ProtectedRoute>
            <ReturnPolicyPageNew />
          </ProtectedRoute>
        }
      />
      <Route
        path="/about-us-new"
        element={
          <ProtectedRoute>
            <AboutUsPageNew />
          </ProtectedRoute>
        }
      />
      <Route
        path="/contact-us-new"
        element={
          <ProtectedRoute>
            <ContactUsPageNew />
          </ProtectedRoute>
        }
      />

      {/* v1.5 FAQ */}
      <Route
        path="/faqs-new"
        element={
          <ProtectedRoute>
            <FaqListPageNew />
          </ProtectedRoute>
        }
      />

      {/* v1.5 Activity Log */}
      <Route
        path="/activity-logs-new"
        element={
          <ProtectedRoute>
            <ActivityLogListPageNew />
          </ProtectedRoute>
        }
      />

      {/* v1.5 Master Data (Batch 2) */}
      <Route
        path="/tags-new"
        element={
          <ProtectedRoute>
            <TagListPageNew />
          </ProtectedRoute>
        }
      />
      <Route
        path="/personas-new"
        element={
          <ProtectedRoute>
            <PersonaListPageNew />
          </ProtectedRoute>
        }
      />
      <Route
        path="/brands-new"
        element={
          <ProtectedRoute>
            <BrandListPageNew />
          </ProtectedRoute>
        }
      />
      <Route
        path="/category-types-new"
        element={
          <ProtectedRoute>
            <CategoryTypeListPageNew />
          </ProtectedRoute>
        }
      />
      <Route
        path="/concerns-new"
        element={
          <ProtectedRoute>
            <ConcernListPageNew />
          </ProtectedRoute>
        }
      />
      <Route
        path="/concern-options-new"
        element={
          <ProtectedRoute>
            <ConcernOptionListPageNew />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile-categories-new"
        element={
          <ProtectedRoute>
            <ProfileCategoryListPageNew />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile-category-options-new"
        element={
          <ProtectedRoute>
            <ProfileCategoryOptionListPageNew />
          </ProtectedRoute>
        }
      />

      {/* v1.5 Marketing extras (Batch 3) */}
      <Route
        path="/referral-codes-new"
        element={
          <ProtectedRoute>
            <ReferralCodeListPageNew />
          </ProtectedRoute>
        }
      />
      <Route
        path="/gift-products-new"
        element={
          <ProtectedRoute>
            <GiftListPageNew />
          </ProtectedRoute>
        }
      />
      <Route
        path="/b1g1-new"
        element={
          <ProtectedRoute>
            <B1g1ListPageNew />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ned-new"
        element={
          <ProtectedRoute>
            <NedListPageNew />
          </ProtectedRoute>
        }
      />

      {/* v1.5 Ramadan (Batch 4) */}
      <Route
        path="/ramadan-spin-prizes-new"
        element={
          <ProtectedRoute>
            <RamadanSpinPrizeListPageNew />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ramadan-recommendations-new"
        element={
          <ProtectedRoute>
            <RamadanRecommendationListPageNew />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ramadan-banners-new"
        element={
          <ProtectedRoute>
            <RamadanBannerListPageNew />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ramadan-participants-new"
        element={
          <ProtectedRoute>
            <RamadanParticipantListPageNew />
          </ProtectedRoute>
        }
      />

      {/* v1.5 Complex (Batch 5) */}
      <Route
        path="/home-banners-new"
        element={
          <ProtectedRoute>
            <HomeBannerSectionListPageNew />
          </ProtectedRoute>
        }
      />
      <Route
        path="/crm-members-new"
        element={
          <ProtectedRoute>
            <CrmMemberListPageNew />
          </ProtectedRoute>
        }
      />
      <Route
        path="/crm-affiliates-new"
        element={
          <ProtectedRoute>
            <CrmAffiliateListPageNew />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stock-movements-new"
        element={
          <ProtectedRoute>
            <StockMovementListPageNew />
          </ProtectedRoute>
        }
      />
      <Route
        path="/abandoned-carts-new"
        element={
          <ProtectedRoute>
            <AbandonedCartListPageNew />
          </ProtectedRoute>
        }
      />

      {/* v1.5 Heavy Reports (Batch 6) */}
      <Route
        path="/reports-new/dashboard"
        element={
          <ProtectedRoute>
            <DashboardReportPageNew />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports-new/sales"
        element={
          <ProtectedRoute>
            <SalesReportPageNew />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports-new/customer"
        element={
          <ProtectedRoute>
            <CustomerReportPageNew />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports-new/transaction"
        element={
          <ProtectedRoute>
            <TransactionReportPageNew />
          </ProtectedRoute>
        }
      />

      {/* v1.5 Odds & ends (Batch 7) */}
      <Route
        path="/abeauties-squad-new"
        element={
          <ProtectedRoute>
            <AbeautiesSquadListPageNew />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seo-report-new"
        element={
          <ProtectedRoute>
            <SeoReportPageNew />
          </ProtectedRoute>
        }
      />

      {/* v1.5 True gaps (Batch 8) */}
      <Route
        path="/transactions-new"
        element={
          <ProtectedRoute>
            <TransactionListPageNew />
          </ProtectedRoute>
        }
      />
      <Route
        path="/supabase-users-new"
        element={
          <ProtectedRoute>
            <SupabaseUserListPageNew />
          </ProtectedRoute>
        }
      />
      <Route
        path="/abby-picks-new"
        element={
          <ProtectedRoute>
            <AbbyPicksListPageNew />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bev-picks-new"
        element={
          <ProtectedRoute>
            <BevPicksListPageNew />
          </ProtectedRoute>
        }
      />
      <Route
        path="/top-picks-promo-new"
        element={
          <ProtectedRoute>
            <TopPicksListPageNew />
          </ProtectedRoute>
        }
      />
      {/* v1.5 Sale Promo + Brand Bulk Upload (Batch 9) */}
      <Route
        path="/sales-new"
        element={
          <ProtectedRoute>
            <SaleListPageNew />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales-new/:id"
        element={
          <ProtectedRoute>
            <SaleFormPageNew />
          </ProtectedRoute>
        }
      />
      <Route
        path="/brand-bulk-upload-logo-new"
        element={
          <ProtectedRoute>
            <BrandLogoUploadPageNew />
          </ProtectedRoute>
        }
      />
      <Route
        path="/brand-bulk-upload-banner-new"
        element={
          <ProtectedRoute>
            <BrandBannerUploadPageNew />
          </ProtectedRoute>
        }
      />

      <Route path="/inventory-product" element={<Navigate to="/reports-new/inventory" replace />} />

      {/* Legacy URL redirects — preserve old URLs for bookmarks, external links, activity logs */}
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
      <Route path="/brand-bulk-upload-logo" element={<Navigate to="/brand-bulk-upload-logo-new" replace />} />
      <Route path="/brand-bulk-upload-banner" element={<Navigate to="/brand-bulk-upload-banner-new" replace />} />
      <Route path="/category-types" element={<Navigate to="/category-types-new" replace />} />
      <Route path="/concern" element={<Navigate to="/concerns-new" replace />} />
      <Route path="/concern-option" element={<Navigate to="/concern-options-new" replace />} />
      <Route path="/profile-category-filter" element={<Navigate to="/profile-categories-new" replace />} />
      <Route path="/profile-category-option" element={<Navigate to="/profile-category-options-new" replace />} />
      <Route path="/flash-sale" element={<Navigate to="/flash-sales-new" replace />} />
      <Route path="/sale-products" element={<Navigate to="/sales-new" replace />} />
      <Route path="/sales/new" element={<Navigate to="/sales-new" replace />} />
      <Route path="/sales/:id" element={<Navigate to="/sales-new" replace />} />
      <Route path="/transactions" element={<Navigate to="/transactions-new" replace />} />
      <Route path="/reports/dashboard" element={<Navigate to="/reports-new/dashboard" replace />} />
      <Route path="/reports/sales" element={<Navigate to="/reports-new/sales" replace />} />
      <Route path="/reports/transaction" element={<Navigate to="/reports-new/transaction" replace />} />
      <Route path="/reports/revenue" element={<Navigate to="/reports-new/revenue" replace />} />
      <Route path="/reports/inventory" element={<Navigate to="/reports-new/inventory" replace />} />
      <Route path="/ramadan-event" element={<Navigate to="/ramadan-participants-new" replace />} />
      <Route path="/ramadan-recommendation" element={<Navigate to="/ramadan-recommendations-new" replace />} />
      <Route path="/b1g1" element={<Navigate to="/b1g1-new" replace />} />
      <Route path="/gift-products" element={<Navigate to="/gift-products-new" replace />} />
      <Route path="/ned-products" element={<Navigate to="/ned-new" replace />} />
      <Route path="/crm" element={<Navigate to="/crm-members-new" replace />} />
      <Route path="/abandoned-bag" element={<Navigate to="/abandoned-carts-new" replace />} />
      <Route path="/stock-movement" element={<Navigate to="/stock-movements-new" replace />} />
      <Route path="/stock-movement/adjust" element={<Navigate to="/stock-movements-new" replace />} />
      <Route path="/abby-picks" element={<Navigate to="/abby-picks-new" replace />} />
      <Route path="/bev-picks" element={<Navigate to="/bev-picks-new" replace />} />
      <Route path="/top-picks-promo" element={<Navigate to="/top-picks-promo-new" replace />} />
      <Route path="/seo-report" element={<Navigate to="/seo-report-new" replace />} />
      <Route path="/abeauties-squad" element={<Navigate to="/abeauties-squad-new" replace />} />

      {/* Fallback: unknown path → dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </>,
  ),
);

function App() {
  const { isDarkMode } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", isDarkMode ? "dark" : "light");
    root.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    initPerformanceMonitoring();
    initServiceWorker();
  }, []);

  return (
    <TooltipProvider>
      <ErrorBoundary>
        <CsvImportWatcher />
        <Toaster />
        <Suspense fallback={<div>Loading...</div>}>
          <RouterProvider router={router} />
        </Suspense>
      </ErrorBoundary>
    </TooltipProvider>
  );
}

export default App;
