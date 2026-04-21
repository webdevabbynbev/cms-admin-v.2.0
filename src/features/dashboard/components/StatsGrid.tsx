import { memo } from 'react';
import {
  Users,
  ShoppingCart,
  CheckCircle2,
  Boxes,
  TrendingUp,
  Package,
} from 'lucide-react';
import { useDashboardStats } from '../hooks';
import { formatIdr, formatNumber } from '../utils/format';
import { KpiCard } from './KpiCard';

const StatsGridComponent = () => {
  const { data, isLoading } = useDashboardStats();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <KpiCard
        title="Total Customers"
        value={formatNumber(data?.users.total)}
        deltaValue={data?.users.new_this_month}
        deltaLabel="this month"
        icon={Users}
        variant="interactive"
        isLoading={isLoading}
      />
      <KpiCard
        title="Successful Orders"
        value={formatNumber(data?.transactions.total)}
        icon={ShoppingCart}
        variant="accent"
        isLoading={isLoading}
      />
      <KpiCard
        title="Monthly Revenue"
        value={formatIdr(data?.transactions.net_sales_this_month)}
        icon={TrendingUp}
        variant="success"
        isLoading={isLoading}
      />
      <KpiCard
        title="Product Catalog"
        value={formatNumber(data?.products.total)}
        icon={Boxes}
        variant="award"
        isLoading={isLoading}
      />
      <KpiCard
        title="Active Products"
        value={formatNumber(data?.products.active)}
        icon={CheckCircle2}
        variant="success"
        isLoading={isLoading}
      />
      <KpiCard
        title="Conversion Rate"
        value="2.45%"
        icon={Package}
        variant="accent"
        isLoading={isLoading}
      />
    </div>
  );
};

export const StatsGrid = memo(StatsGridComponent);
