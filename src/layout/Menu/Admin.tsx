import {
  PieChartOutlined,
  TagsOutlined,
  GiftOutlined,
  RadiusSettingOutlined,
  ProductOutlined,
  PicLeftOutlined,
  PicCenterOutlined,
  FileUnknownOutlined,
  UndoOutlined,
  SafetyOutlined,
  UsergroupAddOutlined,
  UserAddOutlined,
  ShoppingCartOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  DatabaseOutlined,
  StockOutlined,
  ProfileOutlined,
  ApartmentOutlined,
  SortAscendingOutlined,
  UploadOutlined,
  LikeOutlined,
  SwitcherOutlined,
  PhoneOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  TagOutlined,
  MoonOutlined,
  StarOutlined,
  PercentageOutlined,
  BarChartOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import helper from "../../utils/helper";
import type { RoleEnumType } from "../../utils/helper";

const MenuAdmin = (
  roleId: RoleEnumType,
  menuAccess: Record<string, boolean> = {},
): MenuProps["items"] => {
  const isSuperAdmin = roleId === helper.RoleEnum.ADMINISTRATOR;

  const hasAccess = (key: string) => {
    if (isSuperAdmin) return true;
    return !!menuAccess[key];
  };

  return [
    hasAccess("dashboard") && {
      key: "/dashboard",
      icon: <PieChartOutlined />,
      label: "Dashboard",
    },

    // ✅ REPORTS
    (hasAccess("reports") ||
      hasAccess("reports_sales") ||
      hasAccess("reports_transaction") ||
      hasAccess("reports_revenue") ||
      hasAccess("reports_customer") ||
      hasAccess("reports_inventory")) && {
      key: "#reports",
      icon: <BarChartOutlined />,
      label: "Laporan",
      children: [
        hasAccess("reports_sales") && {
          key: "/reports/dashboard",
          icon: <PieChartOutlined />,
          label: "Dashboard Report",
        },
        hasAccess("reports_sales") && {
          key: "/reports/sales",
          icon: <StockOutlined />,
          label: "Laporan Penjualan",
        },
        hasAccess("reports_transaction") && {
          key: "/reports/transaction",
          icon: <ShoppingCartOutlined />,
          label: "Laporan Transaksi",
        },
        hasAccess("reports_revenue") && {
          key: "/reports/revenue",
          icon: <PieChartOutlined />,
          label: "Laporan Pendapatan",
        },
        hasAccess("reports_inventory") && {
          key: "/reports/inventory",
          icon: <DatabaseOutlined />,
          label: "Laporan Inventaris",
        },
        hasAccess("reports_seo") && {
          key: "/seo-report",
          icon: <BarChartOutlined />,
          label: "Laporan SEO",
        },
      ].filter(Boolean) as MenuProps["items"],
    },

    hasAccess("admin") && {
      key: "/admin",
      icon: <UsergroupAddOutlined />,
      label: "Admin",
    },

    hasAccess("abeauties_squad") && {
      key: "/abeauties-squad",
      icon: <StarOutlined />,
      label: "Abeauties Squad",
    },

    // ✅ CRM Modul
    (hasAccess("ecommerce_users") || hasAccess("user_carts") || hasAccess("reports_customer")) && {
      key: "#crm",
      icon: <UsergroupAddOutlined />,
      label: "CRM",
      children: [
        hasAccess("ecommerce_users") && {
          key: "/crm?tab=registered",
          icon: <DatabaseOutlined />,
          label: "Registered User",
        },
        hasAccess("user_carts") && {
          key: "/abandoned-bag",
          icon: <ShoppingCartOutlined />,
          label: "Abandoned Bag",
        },
      ].filter(Boolean) as MenuProps["items"],
    },

    hasAccess("customers") && {
      key: "/customers",
      icon: <UserAddOutlined />,
      label: "Customer",
    },

    (hasAccess("product") ||
      hasAccess("master_product") ||
      hasAccess("inventory_product") ||
      hasAccess("stock_movement") ||
      hasAccess("persona") ||
      hasAccess("tag") ||
      hasAccess("category_types") ||
      hasAccess("concern_category") ||
      hasAccess("profile_category") ||
      hasAccess("products_media")) && {
      key: "#product",
      label: "Product",
      icon: <ProductOutlined />,
      children: [
        hasAccess("master_product") && {
          key: "/master-product",
          icon: <ProductOutlined />,
          label: "Product",
        },
        hasAccess("inventory_product") && {
          key: "/inventory-product",
          icon: <DatabaseOutlined />,
          label: "Inventory",
        },
        hasAccess("stock_movement") && {
          key: "/stock-movement",
          icon: <StockOutlined />,
          label: "Stock Movement",
        },
        hasAccess("persona") && {
          key: "/persona-product",
          icon: <SwitcherOutlined />,
          label: "Persona",
        },
        hasAccess("tag") && {
          key: "/tag-product",
          label: "Tag",
          icon: <TagsOutlined />,
        },
        hasAccess("category_types") && {
          key: "/category-types",
          icon: <ApartmentOutlined />,
          label: "Category Types",
        },
        (hasAccess("concern_category") ||
          hasAccess("concern") ||
          hasAccess("concern_option")) && {
          key: "/concern-category",
          icon: <LikeOutlined />,
          label: "Concern Category",
          children: [
            hasAccess("concern") && {
              key: "/concern",
              icon: <TagOutlined />,
              label: "Concern",
            },
            hasAccess("concern_option") && {
              key: "/concern-option",
              icon: <TagsOutlined />,
              label: "Concern Option",
            },
          ].filter(Boolean) as MenuProps["items"],
        },
        (hasAccess("profile_category") ||
          hasAccess("profile_category_filter") ||
          hasAccess("profile_category_option")) && {
          key: "/profile-category",
          icon: <ProfileOutlined />,
          label: "Profile Category",
          children: [
            hasAccess("profile_category_filter") && {
              key: "/profile-category-filter",
              icon: <LikeOutlined />,
              label: "Profile Category",
            },
            hasAccess("profile_category_option") && {
              key: "/profile-category-option",
              icon: <LikeOutlined />,
              label: "Profile Category Option",
            },
          ].filter(Boolean) as MenuProps["items"],
        },
        hasAccess("products_media") && {
          key: "/products-media",
          icon: <PicCenterOutlined />,
          label: "Product Media Upload",
        },
      ].filter(Boolean) as MenuProps["items"],
    },

    // --- MARKETING ---
    (hasAccess("marketing") ||
      hasAccess("voucher") ||
      hasAccess("referral_codes") ||
      hasAccess("sale_products") ||
      hasAccess("flash_sale") ||
      hasAccess("discounts") ||
      hasAccess("b1g1") ||
      hasAccess("gift_products") ||
      hasAccess("ned") ||
      hasAccess("abby_picks") ||
      hasAccess("bev_picks") ||
      hasAccess("top_picks_promo")) && {
      key: "#discounts",
      label: "Marketing",
      icon: <PieChartOutlined />,
      children: [
        hasAccess("voucher") && {
          key: "/voucher",
          icon: <GiftOutlined />,
          label: "Voucher",
        },
        hasAccess("referral_codes") && {
          key: "/referral-codes",
          icon: <TagOutlined />,
          label: "Referral Codes",
        },
        hasAccess("sale_products") && {
          key: "/sale-products",
          icon: <TagOutlined />,
          label: "Sale Products",
        },
        hasAccess("flash_sale") && {
          key: "/flash-sale",
          icon: <ThunderboltOutlined />,
          label: "Flash Sale",
        },
        hasAccess("discounts") && {
          key: "/discounts",
          icon: <PercentageOutlined />,
          label: "Diskon",
        },
        hasAccess("b1g1") && {
          key: "/b1g1",
          icon: <GiftOutlined />,
          label: "B1G1 (Buy One Get One)",
        },
        hasAccess("gift_products") && {
          key: "/gift-products",
          icon: <GiftOutlined />,
          label: "Gift Products",
        },
        hasAccess("ned") && {
          key: "/ned-products",
          icon: <StarOutlined />,
          label: "NED (Near Expired Date)",
        },
        hasAccess("abby_picks") && {
          key: "/abby-picks",
          icon: <LikeOutlined />,
          label: "Abby Picks",
        },
        hasAccess("bev_picks") && {
          key: "/bev-picks",
          icon: <LikeOutlined />,
          label: "Bev Picks",
        },
        hasAccess("top_picks_promo") && {
          key: "/top-picks-promo",
          icon: <LikeOutlined />,
          label: "Top Picks Promo",
        },
      ].filter(Boolean) as MenuProps["items"],
    },

    // --- MENU RAMADAN EVENT DROPDOWN ---
    (hasAccess("ramadan_event") ||
      hasAccess("ramadan_participant") ||
      hasAccess("ramadan_recommendation")) && {
      key: "#ramadan-event",
      icon: <MoonOutlined />,
      label: "Ramadan Event",
      children: [
        hasAccess("ramadan_participant") && {
          key: "/ramadan-event",
          icon: <UsergroupAddOutlined />,
          label: "Peserta Event",
        },
        hasAccess("ramadan_recommendation") && {
          key: "/ramadan-recommendation",
          icon: <StarOutlined />,
          label: "Rekomendasi Product",
        },
      ].filter(Boolean) as MenuProps["items"],
    },

    hasAccess("transactions") && {
      key: "/transactions",
      icon: <ShoppingCartOutlined />,
      label: "Transaction",
    },

    (hasAccess("content_manager") ||
      hasAccess("brand") ||
      hasAccess("brand_list") ||
      hasAccess("brand_bulk_logo") ||
      hasAccess("brand_bulk_banner") ||
      hasAccess("banners") ||
      hasAccess("faqs") ||
      hasAccess("tnc") ||
      hasAccess("privacy_policy") ||
      hasAccess("return_policy") ||
      hasAccess("contact_us") ||
      hasAccess("about_us")) && {
      key: "#content-manager",
      label: "Content Manager",
      icon: <PicLeftOutlined />,
      children: [
        (hasAccess("brand") ||
          hasAccess("brand_list") ||
          hasAccess("brand_bulk_logo") ||
          hasAccess("brand_bulk_banner")) && {
          key: "#brand",
          icon: <SortAscendingOutlined />,
          label: "Brand",
          children: [
            hasAccess("brand_list") && {
              key: "/brand-product",
              icon: <SortAscendingOutlined />,
              label: "Daftar Brand",
            },
            hasAccess("brand_bulk_logo") && {
              key: "/brand-bulk-upload-logo",
              icon: <UploadOutlined />,
              label: "Bulk Upload Logo",
            },
            hasAccess("brand_bulk_banner") && {
              key: "/brand-bulk-upload-banner",
              icon: <UploadOutlined />,
              label: "Bulk Upload Banner",
            },
          ].filter(Boolean) as MenuProps["items"],
        },
        hasAccess("banners") && {
          key: "#banner",
          icon: <PicCenterOutlined />,
          label: "Banner",
          children: [
            {
              key: "/banners",
              icon: <PicCenterOutlined />,
              label: "Banner",
            },
            {
              key: "/homebanners",
              icon: <HomeOutlined />,
              label: "Home Page",
            },
          ],
        },
        hasAccess("faqs") && {
          key: "/faqs",
          icon: <FileUnknownOutlined />,
          label: "FAQ",
        },
        hasAccess("tnc") && {
          key: "/tnc",
          icon: <WarningOutlined />,
          label: "Terms & Conditions ",
        },
        hasAccess("privacy_policy") && {
          key: "/privacy-policy",
          icon: <SafetyOutlined />,
          label: "Privacy Policy",
        },
        hasAccess("return_policy") && {
          key: "/return-policy",
          icon: <UndoOutlined />,
          label: "Return Policy",
        },
        hasAccess("contact_us") && {
          key: "/contact-us",
          icon: <PhoneOutlined />,
          label: "Contact Us",
        },
        hasAccess("about_us") && {
          key: "/about-us",
          icon: <ExclamationCircleOutlined />,
          label: "About Us",
        },
      ].filter(Boolean) as MenuProps["items"],
    },

    hasAccess("activity_logs") && {
      key: "/activity-logs",
      icon: <RadiusSettingOutlined />,
      label: "Activity Log",
    },

    hasAccess("settings") && {
      key: "/settings",
      icon: <SettingOutlined />,
      label: "Settings",
    },
  ].filter(Boolean) as MenuProps["items"];
};

export default MenuAdmin;
