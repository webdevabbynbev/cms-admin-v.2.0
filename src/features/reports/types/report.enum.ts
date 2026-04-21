export enum ReportType {
  Sales = 'sales',
  Transaction = 'transaction',
  Revenue = 'revenue',
  Inventory = 'inventory',
  Customer = 'customer',
  Product = 'product',
  SalesProduct = 'sales_product',
  Dashboard = 'dashboard',
}

export enum ReportPeriod {
  Daily = 'daily',
  Weekly = 'weekly',
  Monthly = 'monthly',
  Yearly = 'yearly',
  Custom = 'custom',
}

export enum ReportFormat {
  Json = 'json',
  Excel = 'excel',
  Csv = 'csv',
  Pdf = 'pdf',
}

export enum ReportChannel {
  All = 'all',
  Ecommerce = 'ecommerce',
  Pos = 'pos',
}

export enum ReportStatus {
  Pending = 'pending',
  Processing = 'processing',
  Completed = 'completed',
  Failed = 'failed',
}

export enum DateRangePreset {
  Today = 'today',
  Last7Days = '7d',
  ThisMonth = 'this_month',
  Custom = 'custom',
}

export const DATE_RANGE_PRESET_LABELS: Record<DateRangePreset, string> = {
  [DateRangePreset.Today]: 'Hari Ini',
  [DateRangePreset.Last7Days]: '7 Hari Terakhir',
  [DateRangePreset.ThisMonth]: 'Bulan Ini',
  [DateRangePreset.Custom]: 'Custom',
};
