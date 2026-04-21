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
  VOUCHER_REWARD_TYPE_LABELS,
  VOUCHER_TYPE_LABELS,
  VoucherRewardType,
  VoucherType,
} from '../types';
import type { VoucherFilterValues } from '../schemas';

interface VoucherFiltersCardProps {
  values: VoucherFilterValues;
  onChange: (next: VoucherFilterValues) => void;
  onReset: () => void;
}

const VoucherFiltersCardComponent = ({
  values,
  onChange,
  onReset,
}: VoucherFiltersCardProps) => {
  const hasActive = Boolean(values.search || values.type || values.rewardType);

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={values.search ?? ''}
            onChange={(e) => onChange({ ...values, search: e.target.value })}
            placeholder="Cari nama / kode voucher..."
            className="pl-9"
          />
        </div>

        <Select
          value={values.type != null ? String(values.type) : 'all'}
          onValueChange={(v) =>
            onChange({
              ...values,
              type: v === 'all' ? undefined : (Number(v) as VoucherType),
            })
          }
        >
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Tipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe</SelectItem>
            {(Object.keys(VOUCHER_TYPE_LABELS) as unknown as VoucherType[]).map(
              (key) => (
                <SelectItem key={key} value={String(key)}>
                  {VOUCHER_TYPE_LABELS[Number(key) as VoucherType]}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>

        <Select
          value={values.rewardType != null ? String(values.rewardType) : 'all'}
          onValueChange={(v) =>
            onChange({
              ...values,
              rewardType:
                v === 'all' ? undefined : (Number(v) as VoucherRewardType),
            })
          }
        >
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Reward" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Reward</SelectItem>
            {(
              Object.keys(VOUCHER_REWARD_TYPE_LABELS) as unknown as VoucherRewardType[]
            ).map((key) => (
              <SelectItem key={key} value={String(key)}>
                {VOUCHER_REWARD_TYPE_LABELS[Number(key) as VoucherRewardType]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActive ? (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X className="h-4 w-4" />
            Reset
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
};

export const VoucherFiltersCard = memo(VoucherFiltersCardComponent);
