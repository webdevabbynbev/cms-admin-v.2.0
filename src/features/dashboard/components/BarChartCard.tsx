import { memo, type ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';
import type { ChartDataPoint } from '../types';

interface BarChartCardProps {
  title: string;
  data: ChartDataPoint[];
  isLoading?: boolean;
  controls?: ReactNode;
  height?: number;
  barColor?: string;
}

const BarChartCardComponent = ({
  title,
  data,
  isLoading = false,
  controls,
  height = 320,
  barColor = 'var(--color-accent-solid)',
}: BarChartCardProps) => {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {controls}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingState />
        ) : data.length === 0 ? (
          <EmptyState title="No data" description="No chart data available yet." />
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
              <XAxis
                dataKey="label"
                stroke="var(--color-text-muted)"
                fontSize={12}
                tickLine={false}
              />
              <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--popover-foreground)',
                }}
              />
              <Bar dataKey="value" fill={barColor} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export const BarChartCard = memo(BarChartCardComponent);
