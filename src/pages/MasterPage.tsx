import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "../layout/MainLayout";
import { Spin } from "antd";

// ✅ Lazy load all components for code splitting & faster navigation
const TableRamadanRecommendation = React.lazy(
  () =>
    import("../components/Tables/Ramadhan/Recommendation/TableRamadanRecommendation"),
);
const TableAdmin = React.lazy(
  () => import("../components/Tables/Admin/TableAdmin"),
);
const TableSupabaseUser = React.lazy(
  () => import("../components/Tables/SupabaseUser/TableSupabaseUser"),
);
const TableCustomer = React.lazy(
  () => import("../components/Tables/Customer/TableCustomer"),
);
const TableAbeautiesSquad = React.lazy(
  () => import("../components/Tables/AbeautiesSquad/TableAbeautiesSquad"),
);
const TableTag = React.lazy(() => import("../components/Tables/Tag/TableTag"));
const TablePersona = React.lazy(
  () => import("../components/Tables/Persona/TablePersona"),
);
const TableBanner = React.lazy(
  () => import("../components/Tables/Banner/TableBanner"),
);
const HomeBannersPage = React.lazy(() => import("./HomeBannersPage"));
const HomeBannersSectionPage = React.lazy(() => import("./HomeBannersSectionPage"));
const TableActivityLog = React.lazy(
  () => import("../components/Tables/ActivityLog/TableActivityLog"),
);
const TableFaq = React.lazy(() => import("../components/Tables/Faq/TableFaq"));
const TableVoucher = React.lazy(
  () => import("../components/Tables/Voucher/TableVoucher"),
);
const AddFlashSalePage = React.lazy(() => import("../pages/AddFlashSalePage"));
const TableReferralCode = React.lazy(
  () => import("../components/Tables/ReferralCode/TableReferralCode"),
);

const FormPrivacyPolicy = React.lazy(
  () => import("../components/Forms/PrivacyPolicy/FormPrivacyPolicy"),
);
const FormTermNConditions = React.lazy(
  () => import("../components/Forms/TermAndConditions/FormTermAndConditions"),
);
const FormReturnPolicy = React.lazy(
  () => import("../components/Forms/ReturnPolicy/ReturnPolicy"),
);
const FormAboutUs = React.lazy(
  () => import("../components/Forms/AboutUs/FormAboutUs"),
);
const FormContactUs = React.lazy(
  () => import("../components/Forms/ContactUs/FormContactUs"),
);

const TableSetting = React.lazy(
  () => import("../components/Tables/Settings/TableSetting"),
);
const TableBrand = React.lazy(
  () => import("../components/Tables/Brand/TableBrand"),
);
const TableCategoryType = React.lazy(
  () => import("../components/Tables/CategoryTypes/TableCategoryTypes"),
);
const TableConcern = React.lazy(
  () => import("../components/Tables/Concern/TableConcern"),
);
const TableConcernOption = React.lazy(
  () => import("../components/Tables/Concern/TableConcernOption"),
);
const TableProfileCategory = React.lazy(
  () => import("../components/Tables/ProfileCategory/TableProfileCategory"),
);
const TableProfileCategoryOption = React.lazy(
  () =>
    import("../components/Tables/ProfileCategory/TableProfileCategoryOption"),
);

const TableFlashSale = React.lazy(
  () => import("../components/Tables/FlashSale/TableFlashSale"),
);
const TableSale = React.lazy(
  () => import("../components/Tables/Sale/TableSale"),
);
const AddSalePage = React.lazy(() => import("./AddSalePage"));

const TableProduct = React.lazy(
  () => import("../components/Tables/Product/TableProduct"),
);
const TableTransaction = React.lazy(
  () => import("../components/Transaction/TableTransaction"),
);
const TableRamadanEvent = React.lazy(
  () => import("../components/Tables/Ramadhan/Participant/TableRamadanEvent"),
);

const TableDiscount = React.lazy(
  () => import("../components/Tables/Discount/TableDiscount"),
);
const DiscountFormPage = React.lazy(
  () => import("./discounts/DiscountFormPage"),
);

const StockMovementListPage = React.lazy(
  () => import("./stock-movement/StockMovementListPage"),
);
const StockAdjustmentPage = React.lazy(
  () => import("./stock-movement/StockAdjustmentPage"),
);

const B1G1Page = React.lazy(() => import("./promotions/B1G1Page"));
const GiftPage = React.lazy(() => import("./promotions/GiftPage"));
const NEDPage = React.lazy(() => import("./promotions/NEDPage"));
const CRMPage = React.lazy(() => import("./CRMPage"));
const AbandonedBagPage = React.lazy(() => import("./AbandonedBagPage"));
const VoucherFormPage = React.lazy(() => import("./vouchers/VoucherFormPage"));

const BulkUploadBrandLogoPage = React.lazy(
  () => import("./BulkUploadBrandLogoPage"),
);
const BulkUploadBrandBannerPage = React.lazy(
  () => import("./BulkUploadBrandBannerPage"),
);
const TablePicks = React.lazy(
  () => import("../components/Tables/Picks/TablePicks"),
);

const DashboardReportPage = React.lazy(
  () => import("./reports/dashboard/DashboardReportPage"),
);
const SalesReportPage = React.lazy(
  () => import("./reports/sales/SalesReportPage"),
);
const TransactionReportPage = React.lazy(
  () => import("./reports/transaction/TransactionReportPage"),
);
const RevenueReportPage = React.lazy(
  () => import("./reports/revenue/RevenueReportPage"),
);
const InventoryReportPage = React.lazy(
  () => import("./reports/inventory/InventoryReportPage"),
);
const SeoReportPage = React.lazy(() => import("./seo/SeoReportPage"));

// ✅ Loading spinner for lazy-loaded components
const PageLoader = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: 300,
    }}
  >
    <Spin size="large" tip="Loading..." />
  </div>
);

export default function MasterPage(): React.ReactElement {
  return (
    <MainLayout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/admin" element={<TableAdmin />} />
          <Route path="/supabase-users" element={<TableSupabaseUser />} />
          <Route path="/customers" element={<TableCustomer />} />
          <Route path="/tag-product" element={<TableTag />} />
          <Route path="/persona-product" element={<TablePersona />} />
          <Route path="/banners" element={<TableBanner />} />
          <Route path="/homebanners" element={<HomeBannersPage />} />
          <Route path="/homebanners/:sectionId" element={<HomeBannersSectionPage />} />
          <Route path="/master-product" element={<TableProduct />} />
          <Route path="/activity-logs" element={<TableActivityLog />} />
          <Route path="/faqs" element={<TableFaq />} />
          <Route path="/voucher" element={<TableVoucher />} />
          <Route path="/voucher/new" element={<VoucherFormPage />} />
          <Route path="/voucher/:id" element={<VoucherFormPage />} />
          <Route path="/voucher/edit/:id" element={<VoucherFormPage />} />
          <Route path="/referral-codes" element={<TableReferralCode />} />
          <Route path="flash-sales/new" element={<AddFlashSalePage />} />
          <Route path="flash-sales/edit/:id" element={<AddFlashSalePage />} />
          <Route path="/privacy-policy" element={<FormPrivacyPolicy />} />
          <Route path="/tnc" element={<FormTermNConditions />} />
          <Route path="/return-policy" element={<FormReturnPolicy />} />
          <Route path="/about-us" element={<FormAboutUs />} />
          <Route path="/contact-us" element={<FormContactUs />} />
          {/* ✅ DISCOUNTS */}
          <Route path="/discounts" element={<TableDiscount />} />
          <Route
            path="/discounts/new"
            element={<DiscountFormPage mode="create" />}
          />
          <Route
            path="/discounts/:id"
            element={<DiscountFormPage mode="edit" />}
          />

          <Route path="/settings" element={<TableSetting />} />
          <Route path="/brand-product" element={<TableBrand />} />
          <Route
            path="/brand-bulk-upload-logo"
            element={<BulkUploadBrandLogoPage />}
          />
          <Route
            path="/brand-bulk-upload-banner"
            element={<BulkUploadBrandBannerPage />}
          />
          <Route path="/category-types" element={<TableCategoryType />} />
          <Route path="/concern" element={<TableConcern />} />
          <Route path="/concern-option" element={<TableConcernOption />} />
          <Route
            path="/profile-category-filter"
            element={<TableProfileCategory />}
          />
          <Route
            path="/profile-category-option"
            element={<TableProfileCategoryOption />}
          />

          <Route path="/flash-sale" element={<TableFlashSale />} />
          <Route path="/sale-products" element={<TableSale />} />
          <Route path="/sales/new" element={<AddSalePage />} />
          <Route path="/sales/:id" element={<AddSalePage />} />
          <Route path="/transactions" element={<TableTransaction />} />

          {/* ✅ REPORTS */}
          <Route path="/reports/dashboard" element={<DashboardReportPage />} />
          <Route path="/reports/sales" element={<SalesReportPage />} />
          <Route
            path="/reports/transaction"
            element={<TransactionReportPage />}
          />
          <Route path="/reports/revenue" element={<RevenueReportPage />} />
          <Route path="/reports/inventory" element={<InventoryReportPage />} />

          <Route path="/ramadan-event" element={<TableRamadanEvent />} />
          <Route
            path="/ramadan-recommendation"
            element={<TableRamadanRecommendation />}
          />

          {/* ✅ PROMOTIONS (B1G1, Gift, NED) */}
          <Route path="/b1g1" element={<B1G1Page />} />
          <Route path="/gift-products" element={<GiftPage />} />
          <Route path="/ned-products" element={<NEDPage />} />

          {/* ✅ CRM Module */}
          <Route path="/crm" element={<CRMPage />} />
          <Route path="/abandoned-bag" element={<AbandonedBagPage />} />

          {/* ✅ Stock Movement */}
          <Route path="/stock-movement" element={<StockMovementListPage />} />
          <Route
            path="/stock-movement/adjust"
            element={<StockAdjustmentPage />}
          />

          {/* ✅ PICKS */}
          <Route
            path="/abby-picks"
            element={
              <TablePicks title="Abby Picks" apiUrl="/admin/abby-picks" />
            }
          />
          <Route
            path="/bev-picks"
            element={<TablePicks title="Bev Picks" apiUrl="/admin/bev-picks" />}
          />
          <Route
            path="/top-picks-promo"
            element={
              <TablePicks
                title="Top Picks Promo"
                apiUrl="/admin/top-picks-promo"
              />
            }
          />

          <Route path="/seo-report" element={<SeoReportPage />} />

          {/* ✅ ABEAUTIES SQUAD */}
          <Route path="/abeauties-squad" element={<TableAbeautiesSquad />} />

          {/* ✅ Redirect default (taruh paling bawah) */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </MainLayout>
  );
}
