import { memo, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { DiscountItemValueType } from '../../types';
import type { DiscountFormValues } from '../../schemas';
import {
  calcDiscountFinalPrice,
  formatDiscountCurrency,
} from '../../utils/formatters';

const DiscountSummaryBarComponent = () => {
  const form = useFormContext<DiscountFormValues>();
  const items = form.watch('items');

  const summary = useMemo(() => {
    let activeVariants = 0;
    let totalBasePrice = 0;
    let totalFinalPrice = 0;
    items.forEach((item) => {
      if (!item.isActive) return;
      activeVariants += 1;
      const base = item.basePrice ?? 0;
      totalBasePrice += base;
      if (base > 0 && item.value != null) {
        totalFinalPrice += calcDiscountFinalPrice(
          base,
          item.valueType ?? DiscountItemValueType.Percent,
          item.value,
        );
      } else {
        totalFinalPrice += base;
      }
    });
    const saved = Math.max(0, totalBasePrice - totalFinalPrice);
    return {
      activeVariants,
      totalBasePrice,
      totalFinalPrice,
      saved,
    };
  }, [items]);

  if (items.length === 0) return null;

  return (
    <Card>
      <CardContent className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
        <Stat label="Varian Aktif" value={String(summary.activeVariants)} />
        <Stat
          label="Harga Dasar Total"
          value={formatDiscountCurrency(summary.totalBasePrice)}
        />
        <Stat
          label="Harga Setelah Diskon"
          value={formatDiscountCurrency(summary.totalFinalPrice)}
          accent="text-success"
        />
        <Stat
          label="Total Potongan"
          value={formatDiscountCurrency(summary.saved)}
          accent="text-primary"
        />
      </CardContent>
    </Card>
  );
};

interface StatProps {
  label: string;
  value: string;
  accent?: string;
}

const Stat = ({ label, value, accent }: StatProps) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className={`text-sm font-semibold ${accent ?? 'text-foreground'}`}>
      {value}
    </span>
  </div>
);

export const DiscountSummaryBar = memo(DiscountSummaryBarComponent);
