import { memo } from 'react';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
} from '../../types';
import type { VoucherFormValues } from '../../schemas';

const VoucherTypeCardComponent = () => {
  const form = useFormContext<VoucherFormValues>();
  const type = form.watch('type');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tipe Voucher</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipe</FormLabel>
              <FormControl>
                <Select
                  value={String(field.value)}
                  onValueChange={(v) => field.onChange(Number(v) as VoucherType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.keys(VOUCHER_TYPE_LABELS) as unknown as VoucherType[]
                    ).map((key) => (
                      <SelectItem key={key} value={String(key)}>
                        {VOUCHER_TYPE_LABELS[Number(key) as VoucherType]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {type !== VoucherType.Gift ? (
          <FormField
            control={form.control}
            name="rewardType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jenis Reward</FormLabel>
                <FormControl>
                  <Select
                    value={field.value != null ? String(field.value) : ''}
                    onValueChange={(v) =>
                      field.onChange(Number(v) as VoucherRewardType)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih reward..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        Object.keys(
                          VOUCHER_REWARD_TYPE_LABELS,
                        ) as unknown as VoucherRewardType[]
                      ).map((key) => (
                        <SelectItem key={key} value={String(key)}>
                          {
                            VOUCHER_REWARD_TYPE_LABELS[
                              Number(key) as VoucherRewardType
                            ]
                          }
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}
      </CardContent>
    </Card>
  );
};

export const VoucherTypeCard = memo(VoucherTypeCardComponent);
