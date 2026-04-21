import { memo, useMemo } from 'react';
import { Tag, Flame, Clock, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { DiscountStatus } from '../types';
import type { DiscountListItem } from '../types';

interface DiscountStatsCardsProps {
  total: number;
  items: DiscountListItem[];
}

const DiscountStatsCardsComponent = ({ total, items }: DiscountStatsCardsProps) => {
  const { running, upcoming, ended } = useMemo(() => {
    let running = 0;
    let upcoming = 0;
    let ended = 0;
    items.forEach((item) => {
      if (item.status === DiscountStatus.Active) running += 1;
      else if (item.status === DiscountStatus.Upcoming) upcoming += 1;
      else if (item.status === DiscountStatus.Expired) ended += 1;
    });
    return { running, upcoming, ended };
  }, [items]);

  const cards = [
    { label: 'Total Promo', value: total, Icon: Tag },
    { label: 'Sedang Berjalan', value: running, Icon: Flame },
    { label: 'Akan Datang', value: upcoming, Icon: Clock },
    { label: 'Berakhir', value: ended, Icon: CheckCircle2 },
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

export const DiscountStatsCards = memo(DiscountStatsCardsComponent);
