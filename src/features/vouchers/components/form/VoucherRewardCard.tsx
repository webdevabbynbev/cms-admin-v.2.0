import { memo } from 'react';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { VoucherType, VoucherValueMode } from '../../types';
import type { VoucherFormValues } from '../../schemas';

const VoucherRewardCardComponent = () => {
  const form = useFormContext<VoucherFormValues>();
  const type = form.watch('type');
  const valueMode = form.watch('valueMode');

  if (type === VoucherType.Gift) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Nilai Diskon</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="valueMode"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>Tipe Nilai</FormLabel>
              <FormControl>
                <RadioGroup
                  value={String(field.value)}
                  onValueChange={(v) =>
                    field.onChange(Number(v) as VoucherValueMode)
                  }
                  className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                >
                  <label
                    htmlFor="vm-percent"
                    className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 ${
                      field.value === VoucherValueMode.Percentage
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <RadioGroupItem
                      id="vm-percent"
                      value={String(VoucherValueMode.Percentage)}
                    />
                    <span className="text-sm font-medium">Persentase (%)</span>
                  </label>
                  <label
                    htmlFor="vm-fixed"
                    className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 ${
                      field.value === VoucherValueMode.Fixed
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <RadioGroupItem
                      id="vm-fixed"
                      value={String(VoucherValueMode.Fixed)}
                    />
                    <span className="text-sm font-medium">Nominal (Rp)</span>
                  </label>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {valueMode === VoucherValueMode.Percentage ? (
            <>
              <FormField
                control={form.control}
                name="percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Persentase (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="1"
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === '' ? null : Number(e.target.value),
                          )
                        }
                        placeholder="10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxDiscPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Diskon (Rp)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="1000"
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === '' ? null : Number(e.target.value),
                          )
                        }
                        placeholder="50000"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Opsional
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          ) : (
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Nominal Diskon (Rp)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step="1000"
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === '' ? null : Number(e.target.value),
                        )
                      }
                      placeholder="25000"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="minPurchaseAmount"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Minimum Pembelian (Rp)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="1000"
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === '' ? null : Number(e.target.value),
                      )
                    }
                    placeholder="100000"
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Opsional — batas minimum belanja agar voucher bisa dipakai
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export const VoucherRewardCard = memo(VoucherRewardCardComponent);
