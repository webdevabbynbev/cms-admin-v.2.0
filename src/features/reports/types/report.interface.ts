import type {
  DateRangePreset,
  ReportChannel,
  ReportFormat,
  ReportPeriod,
  ReportStatus,
  ReportType,
} from './report.enum';

export interface Report<TData = unknown, TSummary = unknown> {
  id: number;
  reportNumber: string;
  title: string;
  description: string | null;
  reportType: ReportType;
  reportPeriod: ReportPeriod;
  reportFormat: ReportFormat;
  channel: ReportChannel;
  startDate: string;
  endDate: string;
  status: ReportStatus;
  filters: Record<string, unknown> | null;
  data: TData | null;
  summary: TSummary | null;
  filePath: string | null;
  fileUrl: string | null;
  generatedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReportPayload {
  title: string;
  description?: string;
  report_type: ReportType;
  report_period: ReportPeriod;
  report_format: ReportFormat;
  start_date: string;
  end_date: string;
  channel?: ReportChannel;
  filters?: Record<string, unknown>;
}

export interface RevenueByDateRow {
  date: string;
  gross_revenue: number;
  discount: number;
  net_revenue: number;
  transactions: number;
}

export interface RevenueReportData {
  revenue_by_date: RevenueByDateRow[];
}

export interface RevenueReportSummary {
  total_gross_revenue: number;
  total_discount: number;
  total_net_revenue: number;
  total_transactions: number;
  avg_transaction_value: number;
  period?: string;
}

export interface InventoryProductRow {
  id: number;
  sku: string;
  name: string;
  base_price: number;
  current_stock: number;
  total_sold: number;
  stock_value: number;
}

export interface InventoryReportData {
  products: InventoryProductRow[];
  low_stock_products: InventoryProductRow[];
}

export interface InventoryReportSummary {
  total_products: number;
  total_stock_value: number;
  low_stock_count: number;
  period?: string;
}

export type RevenueReport = Report<RevenueReportData, RevenueReportSummary>;
export type InventoryReport = Report<InventoryReportData, InventoryReportSummary>;

// --- Sales Report ---
export interface SalesTransactionRow {
  id: number;
  transaction_number?: string;
  customer_name?: string;
  channel?: string;
  total?: number;
  discount?: number;
  status?: string;
  created_at?: string;
}

export interface SalesReportData {
  transactions: SalesTransactionRow[];
  grouped_by_period?: Array<{ period: string; total: number; transactions: number }>;
  pending_transactions?: SalesTransactionRow[];
  failed_transactions?: SalesTransactionRow[];
}

export interface SalesReportSummary {
  total_transactions: number;
  total_revenue: number;
  total_discount: number;
  total_items_subtotal: number;
  total_shipping: number;
  total_gross_sales: number;
  total_gross_items: number;
  avg_order_value: number;
  by_channel?: Record<string, number>;
  report_period?: string;
  date_preset?: string;
  period?: string;
}

// --- Customer Report ---
export interface CustomerReportRow {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  total_transactions: number;
  total_spent: number;
  avg_order_value: number;
  last_transaction?: string | null;
  loyalty?: string;
}

export interface CustomerReportData {
  customers: CustomerReportRow[];
  top_customers: CustomerReportRow[];
}

export interface CustomerReportSummary {
  total_customers: number;
  total_transactions: number;
  total_revenue: number;
  avg_customer_value: number;
  period?: string;
}

// --- Transaction Report ---
export interface TransactionReportRow {
  id: number;
  transaction_number?: string;
  customer_name?: string;
  channel?: string;
  payment_method?: string;
  total?: number;
  discount?: number;
  status?: string;
  created_at?: string;
}

export interface TransactionReportData {
  transactions: TransactionReportRow[];
  status_breakdown?: Record<string, number>;
  channel_breakdown?: Record<string, number>;
  payment_method_breakdown?: Record<string, number>;
}

export interface TransactionReportSummary {
  total_transactions: number;
  total_amount: number;
  total_discount: number;
  avg_transaction_value: number;
  period?: string;
}

// --- Dashboard Summary (separate endpoint) ---
export interface DashboardTrendRow {
  date: string;
  sales: number;
  orders: number;
}

export interface DashboardSummaryData {
  summary: {
    total_sales: number;
    total_orders: number;
    products_sold: number;
    total_visitors: number;
    total_buyers: number;
    conversion_rate: number;
    aov: number;
    asp: number;
    growth: {
      sales: number;
      orders: number;
    };
  };
  trend: DashboardTrendRow[];
}

export type SalesReport = Report<SalesReportData, SalesReportSummary>;
export type CustomerReport = Report<CustomerReportData, CustomerReportSummary>;
export type TransactionReport = Report<
  TransactionReportData,
  TransactionReportSummary
>;

export interface DateRangeValue {
  preset: DateRangePreset;
  startIso: string;
  endIso: string;
}

export interface ReportSummaryCard {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  helper?: string;
}
