import { memo, useMemo } from 'react';
import { Zap, Flame, Clock, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { FlashSaleStatus } from '../types';
import type { FlashSaleListItem } from '../types';

interface FlashSaleStatsCardsProps {
  items: FlashSaleListItem[];
}

const FlashSaleStatsCardsComponent = ({ items }: FlashSaleStatsCardsProps) => {
  const counts = useMemo(() => {
    let running = 0;
    let upcoming = 0;
    let ended = 0;
    items.forEach((item) => {
      if (item.status === FlashSaleStatus.Active) running += 1;
      else if (item.status === FlashSaleStatus.Upcoming) upcoming += 1;
      else if (item.status === FlashSaleStatus.Ended) ended += 1;
    });
    return { running, upcoming, ended };
  }, [items]);

  const cards = [
    { label: 'Total Flash Sale', value: items.length, Icon: Zap },
    { label: 'Sedang Berjalan', value: counts.running, Icon: Flame },
    { label: 'Akan Datang', value: counts.upcoming, Icon: Clock },
    { label: 'Berakhir', value: counts.ended, Icon: CheckCircle2 },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ label, value, Icon }) => (
        <Card key={label}>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-muted-foreground">
                {label}
              </span>
              <span className="text-2xl font-semibold text-foreground">
                {value}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export const FlashSaleStatsCards = memo(FlashSaleStatsCardsComponent);
