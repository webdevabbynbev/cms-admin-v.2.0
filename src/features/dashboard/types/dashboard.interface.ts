export interface DashboardStats {
  users: {
    total: number;
    new_this_month: number;
  };
  transactions: {
    total: number;
    net_sales_this_month: number;
  };
  products: {
    total: number;
    active: number;
  };
  top_customers: TopCustomer[];
}

export interface TopCustomer {
  id: number;
  name: string;
  total_spent: number;
  total_orders: number;
}

export interface ProductSummary {
  id: number | string;
  name: string;
  total: number;
}

export interface TransactionPeriodPoint {
  date?: string;
  monthName?: string;
  total: number;
}

export interface TransactionPeriodResponse {
  daily: TransactionPeriodPoint[];
  monthly: TransactionPeriodPoint[];
}

export interface UserRegistrationPoint {
  date?: string;
  monthName?: string;
  total: number;
}

export interface UserRegistrationResponse {
  daily: UserRegistrationPoint[];
  monthly: UserRegistrationPoint[];
}

export interface TrafficPoint {
  date: string;
  total: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}
