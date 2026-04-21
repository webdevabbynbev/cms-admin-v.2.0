import { memo } from 'react';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  DISCOUNT_DAY_OF_WEEK_LABELS,
  DiscountDayOfWeek,
} from '../../types';
import type { DiscountFormValues } from '../../schemas';

const DAY_OPTIONS: DiscountDayOfWeek[] = [
  DiscountDayOfWeek.Monday,
  DiscountDayOfWeek.Tuesday,
  DiscountDayOfWeek.Wednesday,
  DiscountDayOfWeek.Thursday,
  DiscountDayOfWeek.Friday,
  DiscountDayOfWeek.Saturday,
  DiscountDayOfWeek.Sunday,
];

const DiscountScheduleCardComponent = () => {
  const form = useFormContext<DiscountFormValues>();
  const noExpiry = form.watch('noExpiry');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Jadwal & Channel</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-md border border-border p-3">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm">Status Aktif</FormLabel>
                  <FormDescription className="text-xs">
                    Nonaktifkan tanpa menghapus
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="noExpiry"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-md border border-border p-3">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm">Tanpa Kadaluarsa</FormLabel>
                  <FormDescription className="text-xs">
                    Aktif terus menerus tanpa batas waktu
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {!noExpiry ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="startedAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal Mulai</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expiredAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal Berakhir</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ) : null}

        <FormField
          control={form.control}
          name="daysOfWeek"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hari Aktif</FormLabel>
              <FormDescription className="text-xs">
                Kosongkan untuk aktif setiap hari
              </FormDescription>
              <FormControl>
                <div className="flex flex-wrap gap-2">
                  {DAY_OPTIONS.map((day) => {
                    const checked = field.value.includes(day);
                    return (
                      <label
                        key={day}
                        className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                          checked
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border hover:border-primary/40'
                        }`}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(next) => {
                            if (next) {
                              field.onChange([...field.value, day]);
                            } else {
                              field.onChange(
                                field.value.filter((v) => v !== day),
                              );
                            }
                          }}
                        />
                        {DISCOUNT_DAY_OF_WEEK_LABELS[day]}
                      </label>
                    );
                  })}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="isEcommerce"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-md border border-border p-3">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm">Channel E-commerce</FormLabel>
                  <FormDescription className="text-xs">
                    Aktifkan pada toko online
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isPos"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-md border border-border p-3">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm">Channel POS</FormLabel>
                  <FormDescription className="text-xs">
                    Aktifkan pada toko fisik
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export const DiscountScheduleCard = memo(DiscountScheduleCardComponent);
