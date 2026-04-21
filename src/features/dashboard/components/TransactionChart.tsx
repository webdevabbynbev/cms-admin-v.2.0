import { memo, useMemo, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTransactionPeriod } from '../hooks';
import { ChartPeriod, type ChartDataPoint } from '../types';
import { BarChartCard } from './BarChartCard';

const TransactionChartComponent = () => {
  const [period, setPeriod] = useState<ChartPeriod>(ChartPeriod.Daily);
  const { data, isLoading } = useTransactionPeriod();

  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (!data) return [];
    const points = period === ChartPeriod.Daily ? data.daily : data.monthly;
    return points.map((item) => ({
      label:
        period === ChartPeriod.Daily && item.date
          ? item.date.split('-')[2] ?? ''
          : item.monthName ?? '',
      value: item.total,
    }));
  }, [data, period]);

  return (
    <BarChartCard
      title="Transactions"
      data={chartData}
      isLoading={isLoading}
      controls={
        <Select value={period} onValueChange={(v) => setPeriod(v as ChartPeriod)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ChartPeriod.Daily}>Daily (Current Month)</SelectItem>
            <SelectItem value={ChartPeriod.Monthly}>Monthly (Current Year)</SelectItem>
          </SelectContent>
        </Select>
      }
      barColor="var(--color-accent-solid)"
    />
  );
};

export const TransactionChart = memo(TransactionChartComponent);
