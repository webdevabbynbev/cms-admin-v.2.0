import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';
import {
  StatsGrid,
  TransactionChart,
  UserGrowthChart,
  TrafficChart,
  TopProductsTable,
  TopCustomersTable,
  LowStockTable,
} from '../components';

const DashboardPage = () => {
  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="Dashboard"
          description="Overview of your store performance and key metrics."
        />

        <StatsGrid />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TransactionChart />
          <UserGrowthChart />
        </div>

        <TrafficChart />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <TopProductsTable />
          <TopCustomersTable />
          <LowStockTable />
        </div>
      </PageContainer>
    </AppShell>
  );
};

export default DashboardPage;
