import { memo, useMemo } from 'react';
import { Ticket, Flame, Clock, ShoppingCart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { Voucher } from '../types';
import { deriveVoucherStatus } from '../utils/derive-status';

interface VoucherStatsCardsProps {
  total: number;
  items: Voucher[];
}

const VoucherStatsCardsComponent = ({ total, items }: VoucherStatsCardsProps) => {
  const stats = useMemo(() => {
    let active = 0;
    let upcoming = 0;
    let used = 0;
    items.forEach((item) => {
      const status = deriveVoucherStatus(item);
      if (status === 'active') active += 1;
      if (status === 'upcoming') upcoming += 1;
      used += item.usedCount;
    });
    return { active, upcoming, used };
  }, [items]);

  const cards = [
    { label: 'Total Voucher', value: total, Icon: Ticket },
    { label: 'Sedang Berjalan', value: stats.active, Icon: Flame },
    { label: 'Akan Datang', value: stats.upcoming, Icon: Clock },
    { label: 'Total Digunakan', value: stats.used, Icon: ShoppingCart },
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

export const VoucherStatsCards = memo(VoucherStatsCardsComponent);
