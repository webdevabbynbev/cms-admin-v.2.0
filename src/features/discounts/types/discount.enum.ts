export enum DiscountItemValueType {
  Percent = 'percent',
  Fixed = 'fixed',
}

export enum DiscountAppliesTo {
  AllProducts = 1,
  Categories = 2,
  Products = 3,
}

export enum DiscountScope {
  Variant = 'variant',
  Product = 'product',
  Brand = 'brand',
  AllProducts = 'all_products',
}

export enum DiscountStatus {
  Active = 'active',
  Upcoming = 'upcoming',
  Expired = 'expired',
  Inactive = 'inactive',
}

export enum DiscountActiveFlag {
  Inactive = 0,
  Active = 1,
}

export enum DiscountImportFormat {
  Csv = 'csv',
  Excel = 'excel',
}

export enum DiscountDayOfWeek {
  Sunday = '0',
  Monday = '1',
  Tuesday = '2',
  Wednesday = '3',
  Thursday = '4',
  Friday = '5',
  Saturday = '6',
}

export const DISCOUNT_STATUS_LABELS: Record<DiscountStatus, string> = {
  [DiscountStatus.Active]: 'Sedang Berjalan',
  [DiscountStatus.Upcoming]: 'Akan Datang',
  [DiscountStatus.Expired]: 'Berakhir',
  [DiscountStatus.Inactive]: 'Nonaktif',
};

export const DISCOUNT_ITEM_VALUE_TYPE_LABELS: Record<DiscountItemValueType, string> = {
  [DiscountItemValueType.Percent]: 'Persentase (%)',
  [DiscountItemValueType.Fixed]: 'Nominal (Rp)',
};

export const DISCOUNT_SCOPE_LABELS: Record<DiscountScope, string> = {
  [DiscountScope.Variant]: 'Per Varian',
  [DiscountScope.Product]: 'Per Produk',
  [DiscountScope.Brand]: 'Per Brand',
  [DiscountScope.AllProducts]: 'Semua Produk',
};

export const DISCOUNT_DAY_OF_WEEK_LABELS: Record<DiscountDayOfWeek, string> = {
  [DiscountDayOfWeek.Sunday]: 'Minggu',
  [DiscountDayOfWeek.Monday]: 'Senin',
  [DiscountDayOfWeek.Tuesday]: 'Selasa',
  [DiscountDayOfWeek.Wednesday]: 'Rabu',
  [DiscountDayOfWeek.Thursday]: 'Kamis',
  [DiscountDayOfWeek.Friday]: 'Jumat',
  [DiscountDayOfWeek.Saturday]: 'Sabtu',
};

export const DISCOUNT_ALL_PRODUCTS_MARKER = '[ALL_PRODUCTS]';
