import { memo, useMemo, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTraffic } from '../hooks';
import { TrafficRange, type ChartDataPoint } from '../types';
import { BarChartCard } from './BarChartCard';

const TrafficChartComponent = () => {
  const [days, setDays] = useState<TrafficRange>(TrafficRange.Week);
  const { data, isLoading } = useTraffic(days);

  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (!data) return [];
    return data.map((item) => ({
      label: item.date.split('-').slice(-2).join('/'),
      value: item.total,
    }));
  }, [data]);

  return (
    <BarChartCard
      title="Activity Log"
      data={chartData}
      isLoading={isLoading}
      controls={
        <Select
          value={String(days)}
          onValueChange={(v) => setDays(Number(v) as TrafficRange)}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={String(TrafficRange.Week)}>Last 7 days</SelectItem>
            <SelectItem value={String(TrafficRange.Fortnight)}>Last 14 days</SelectItem>
            <SelectItem value={String(TrafficRange.Month)}>Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      }
      barColor="var(--color-success-solid)"
    />
  );
};

export const TrafficChart = memo(TrafficChartComponent);
