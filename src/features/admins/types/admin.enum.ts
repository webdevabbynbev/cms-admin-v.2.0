export enum AdminRole {
  Admin = 1,
  Gudang = 3,
  Finance = 4,
  Media = 5,
  CashierGudang = 6,
  Cashier = 7,
}

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  [AdminRole.Admin]: 'Admin',
  [AdminRole.Gudang]: 'Gudang',
  [AdminRole.Finance]: 'Finance',
  [AdminRole.Media]: 'Media',
  [AdminRole.CashierGudang]: 'Cashier dan Gudang',
  [AdminRole.Cashier]: 'Cashier',
};

export const ADMIN_ROLE_OPTIONS = Object.entries(ADMIN_ROLE_LABELS).map(
  ([value, label]) => ({ value: Number(value) as AdminRole, label }),
);

export interface PermissionItem {
  value: string;
  label: string;
}

export interface PermissionSection {
  key: string;
  label: string;
  items: PermissionItem[];
}

export const PERMISSION_SECTIONS: PermissionSection[] = [
  {
    key: 'reports',
    label: 'Laporan (Dashboard)',
    items: [
      { value: 'reports', label: 'Laporan (Dashboard)' },
      { value: 'reports_sales', label: 'Laporan Penjualan' },
      { value: 'reports_transaction', label: 'Laporan Transaksi' },
      { value: 'reports_revenue', label: 'Laporan Pendapatan' },
      { value: 'reports_customer', label: 'Laporan Pelanggan' },
      { value: 'reports_inventory', label: 'Laporan Inventaris' },
    ],
  },
  {
    key: 'system',
    label: 'E-commerce & Customers',
    items: [
      { value: 'admin', label: 'Admin Management' },
      { value: 'ecommerce_users', label: 'Users E-commerce' },
      { value: 'customers', label: 'Customer List' },
    ],
  },
  {
    key: 'product',
    label: 'Product & Inventory',
    items: [
      { value: 'product', label: 'Modul Product (Parent)' },
      { value: 'master_product', label: 'Daftar Product' },
      { value: 'inventory_product', label: 'Inventory' },
      { value: 'stock_movement', label: 'Stock Movement' },
      { value: 'persona', label: 'Persona' },
      { value: 'tag', label: 'Tag' },
      { value: 'category_types', label: 'Category Types' },
      { value: 'products_media', label: 'Product Media Upload' },
    ],
  },
  {
    key: 'categories',
    label: 'Product Categories (Concern/Profile)',
    items: [
      { value: 'concern_category', label: 'Concern Category (Modul)' },
      { value: 'concern', label: 'Concern Item' },
      { value: 'concern_option', label: 'Concern Option' },
      { value: 'profile_category', label: 'Profile Category (Modul)' },
      { value: 'profile_category_filter', label: 'Filter Profile' },
      { value: 'profile_category_option', label: 'Option Profile' },
    ],
  },
  {
    key: 'brand',
    label: 'Brand Management',
    items: [
      { value: 'brand', label: 'Brand (Modul Parent)' },
      { value: 'brand_list', label: 'Daftar Brand' },
      { value: 'brand_bulk_logo', label: 'Brand Bulk Upload Logo' },
      { value: 'brand_bulk_banner', label: 'Brand Bulk Upload Banner' },
    ],
  },
  {
    key: 'marketing',
    label: 'Marketing & Promotions',
    items: [
      { value: 'marketing', label: 'Modul Marketing (Parent)' },
      { value: 'voucher', label: 'Voucher' },
      { value: 'referral_codes', label: 'Referral Codes' },
      { value: 'sale_products', label: 'Sale Products' },
      { value: 'flash_sale', label: 'Flash Sale' },
      { value: 'discounts', label: 'Diskon' },
      { value: 'b1g1', label: 'B1G1 (Buy One Get One)' },
      { value: 'gift_products', label: 'Gift Products' },
      { value: 'ned', label: 'NED (Near Expired Date)' },
      { value: 'abby_picks', label: 'Abby Picks' },
      { value: 'bev_picks', label: 'Bev Picks' },
      { value: 'top_picks_promo', label: 'Top Picks Promo' },
    ],
  },
  {
    key: 'ramadan',
    label: 'Ramadan Event',
    items: [
      { value: 'ramadan_event', label: 'Modul Ramadan Event' },
      { value: 'ramadan_participant', label: 'Peserta Event' },
      { value: 'ramadan_recommendation', label: 'Rekomendasi Product' },
    ],
  },
  {
    key: 'content',
    label: 'Transaction & CMS Content',
    items: [
      { value: 'transactions', label: 'Transaction' },
      { value: 'content_manager', label: 'Content Manager (Modul Parent)' },
      { value: 'banners', label: 'Banner' },
      { value: 'faqs', label: 'FAQ' },
      { value: 'tnc', label: 'Terms & Conditions' },
      { value: 'privacy_policy', label: 'Privacy Policy' },
      { value: 'return_policy', label: 'Return Policy' },
      { value: 'contact_us', label: 'Contact Us' },
      { value: 'about_us', label: 'About Us' },
    ],
  },
  {
    key: 'settings',
    label: 'System Logs & Settings',
    items: [
      { value: 'activity_logs', label: 'Activity Log' },
      { value: 'settings', label: 'Settings' },
    ],
  },
];

export const ALL_PERMISSION_KEYS: string[] = PERMISSION_SECTIONS.flatMap((s) =>
  s.items.map((i) => i.value),
);
