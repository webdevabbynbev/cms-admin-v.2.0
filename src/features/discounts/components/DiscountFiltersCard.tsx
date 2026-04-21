import { memo } from 'react';
import { Search, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DISCOUNT_STATUS_LABELS,
  DiscountStatus,
} from '../types';
import type { DiscountFilterValues } from '../schemas';

interface DiscountFiltersCardProps {
  values: DiscountFilterValues;
  onChange: (next: DiscountFilterValues) => void;
  onReset: () => void;
}

const STATUS_OPTIONS: { value: DiscountStatus; label: string }[] = [
  { value: DiscountStatus.Active, label: DISCOUNT_STATUS_LABELS[DiscountStatus.Active] },
  { value: DiscountStatus.Upcoming, label: DISCOUNT_STATUS_LABELS[DiscountStatus.Upcoming] },
  { value: DiscountStatus.Expired, label: DISCOUNT_STATUS_LABELS[DiscountStatus.Expired] },
  { value: DiscountStatus.Inactive, label: DISCOUNT_STATUS_LABELS[DiscountStatus.Inactive] },
];

const CHANNEL_OPTIONS: { value: 'ecommerce' | 'pos'; label: string }[] = [
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'pos', label: 'POS' },
];

const DiscountFiltersCardComponent = ({
  values,
  onChange,
  onReset,
}: DiscountFiltersCardProps) => {
  const hasActiveFilter = Boolean(
    values.search ||
      values.status ||
      values.channel,
  );

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={values.search ?? ''}
            onChange={(event) =>
              onChange({ ...values, search: event.target.value })
            }
            placeholder="Cari nama / kode diskon..."
            className="pl-9"
          />
        </div>

        <Select
          value={values.status ?? 'all'}
          onValueChange={(value) =>
            onChange({
              ...values,
              status: value === 'all' ? undefined : (value as DiscountStatus),
            })
          }
        >
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={values.channel ?? 'all'}
          onValueChange={(value) =>
            onChange({
              ...values,
              channel: value === 'all' ? undefined : (value as 'ecommerce' | 'pos'),
            })
          }
        >
          <SelectTrigger className="sm:w-36">
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Channel</SelectItem>
            {CHANNEL_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilter ? (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X className="h-4 w-4" />
            Reset
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
};

export const DiscountFiltersCard = memo(DiscountFiltersCardComponent);
